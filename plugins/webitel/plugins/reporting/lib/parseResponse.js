/**
 * Created by igor on 09.12.16.
 */

"use strict";

import _ from 'lodash'


function describeConst(val) {
  return {
    writable: false,
    enumerable: false,
    configurable: false,
    value: val
  };
}

const props = {
  inherits: describeConst(function (SuperClass) {

    const prototype = Object.create(SuperClass.prototype, {
      constructor: describeConst(this),
      superConstructor: describeConst(SuperClass)
    });

    Object.defineProperties(this, {
      prototype: describeConst(prototype),
      Super: describeConst(SuperClass)
    });

    return this;
  })
};

_.mixin(_, {

  /**
   * Add class-related behavior to a function, currently this
   * only attaches an .inherits() method.
   *
   * @param  {Constructor} ClassConstructor - The function that should be extended
   * @return {Constructor} - the constructor passed in;
   */
  class: function (ClassConstructor) {
    return Object.defineProperties(ClassConstructor, props);
  }
});

var respOpts = {
  "partialRows": false,
  "minimalColumns": false,
  "asAggConfigResults": true
}


var schemasVis = {
  'table': {
    'metric': {
      group: 'metrics',
      name: 'metric'
    },
    'bucket': {
      group: 'buckets',
      name: 'bucket'
    },
    'split': {
      group: 'buckets',
      name: 'split'
    }
  },

  'area': {
    metric: {
      group: 'metrics',
      name: 'metric'
    },
    segment: {
      group: 'buckets',
      name: 'segment'
    },
    group: {
      group: 'buckets',
      name: 'group'
    },
    split: {
      group: 'buckets',
      name: 'split'
    }
  },

  'line': {
    metric: {
      group: 'metrics',
      name: 'metric'
    },
    radius: {
      group: 'metrics',
      name: 'radius'
    },
    segment: {
      group: 'buckets',
      name: 'segment'
    },
    group: {
      group: 'buckets',
      name: 'group'
    },
    split: {
      group: 'buckets',
      name: 'split'
    }
  }
};

_.class(SplitAcr).inherits(AggConfigResult);
function SplitAcr(agg, parent, key) {
  SplitAcr.Super.call(this, agg, parent, key, key);
}

function getResponseAggs(_aggs) {
  return getRequestAggs(_aggs).reduce(function (responseValuesAggs, agg) {
    var aggs = agg;
    return aggs ? responseValuesAggs.concat(aggs) : responseValuesAggs;
  }, [])
}

function getRequestAggs(_aggs) {
  return _.sortBy(_aggs, function (agg) {
    return (agg.schema.group) === 'metrics' ? 1 : 0;
  });
}

function Agg(item, ags) {

}

function getColumns(vis) {
  let schema = schemasVis[vis.type];
  vis.aggs.map(function (i) {
    i.schema = schema[i.schema]
  });
  return getResponseAggs(vis.aggs)
}

function collectBucket(write, bucket, key) {
  var agg = write.aggStack.shift();
  if (!agg) {
    console.log(write)
    return;
  }
  switch (agg.schema.group) {
    case "buckets":
      var buckets = new Buckets(bucket[agg.id]);
      if (buckets.length) {
        var splitting = write.canSplit && agg.schema.name === 'split';
        if (splitting) {
          write.split(agg, buckets, function forEachBucket(subBucket, key) {
            collectBucket(write, subBucket, getKey(subBucket), key);
          });
        } else {
          buckets.forEach(function (subBucket, key) {
            write.cell(agg, getKey(subBucket, key), function () {
              collectBucket(write, subBucket, getKey(subBucket, key));
            })
          });
        }
      } else if (write.partialRows && write.metricsForAllBuckets && write.minimalColumns) {
        debugger
      } else {
        write.row();
      }
      break;

    case "metrics":
      var value = getValue(agg.id, bucket, agg.schema.name);
      write.cell(agg, value, function () {
        if (!write.aggStack.length) {
          // row complete
          write.row();
        } else {
          // process the next agg at this same level
          collectBucket(write, bucket, key);
        }
      });
      break
  }

  write.aggStack.unshift(agg);
}

function getValue(id, bucket, schemaName) {
  return isFinite(bucket[id] && bucket[id].value) ? bucket[id].value : bucket.doc_count;
}

function getKey(subBucket, key) {
  return subBucket.key_as_string || subBucket.key || key
}


function Buckets(aggResp) {
  aggResp = aggResp || false;
  this.buckets = aggResp.buckets || [];
  this.objectMode = _.isPlainObject(this.buckets);

  if (this.objectMode) {
    this._keys = _.keys(this.buckets);
    this.length = this._keys.length;
  } else {
    this.length = this.buckets.length;
  }

  this.forEach = function (fn) {
    let buckets = this.buckets;

    if (this.objectMode) {
      this._keys.forEach(function (key) {
        fn(buckets[key], key);
      });
    } else {
      buckets.forEach(function (bucket) {
        fn(bucket, bucket.key);
      });
    }
  }
}


function Table() {
  this.columns = null; // written with the first row
  this.rows = [];
}

Table.prototype.title = function () {
  return ''
};


function TabbedAggResponseWriter(vis, opts) {
  this.vis = vis;
  this.opts = opts || {};
  this.rowBuffer = [];

  let visIsHier = false;

  // do the options allow for splitting? we will only split if true and
  // tabify calls the split method.
  this.canSplit = this.opts.canSplit !== false;

  // should we allow partial rows to be included in the tables? if a
  // partial row is found, it is filled with empty strings ''
  this.partialRows = this.opts.partialRows == null ? visIsHier : this.opts.partialRows;

  // if true, we will not place metric columns after every bucket
  // even if the vis is hierarchical. if false, and the vis is
  // hierarchical, then we will display metric columns after
  // every bucket col
  this.minimalColumns = visIsHier ? !!this.opts.minimalColumns : true;

  // true if we can expect metrics to have been calculated
  // for every bucket
  this.metricsForAllBuckets = visIsHier;

  // if true, values will be wrapped in aggConfigResult objects which link them
  // to their aggConfig and enable the filterbar and tooltip formatters
  this.asAggConfigResults = !!this.opts.asAggConfigResults;

  this.columns = getColumns(vis, this.minimalColumns);

  this.aggStack = this.columns;

  this.root = new TableGroup();
  this.acrStack = [];
  this.splitStack = [this.root];
}

TabbedAggResponseWriter.prototype.cell = function (agg, value, block) {
  if (this.asAggConfigResults) {
    value = new AggConfigResult(agg, this.acrStack[0], value, value);
  }

  let staskResult = this.asAggConfigResults && value.type === 'bucket';

  this.rowBuffer.push(value);
  if (staskResult) this.acrStack.unshift(value);

  if (_.isFunction(block)) block.call(this);

  this.rowBuffer.pop(value);
  if (staskResult) this.acrStack.shift();

  return value;
};


TabbedAggResponseWriter.prototype._table = function (group, agg, key) {
  let Class = (group) ? TableGroup : Table;
  let table = new Class();
  let parent = this.splitStack[0];

  if (group) {
    table.aggConfig = agg;
    table.key = key;
    table.title =  'TODO';
  }

  // link the parent and child
  table.$parent = parent;
  parent.tables.push(table);

  return table;
};

TabbedAggResponseWriter.prototype.row = function (buffer) {
  let cells = buffer || this.rowBuffer.slice(0);

  if (!this.partialRows && cells.length < this.columns.length) {
    return;
  }

  let split = this.splitStack[0];
  let table = split.tables[0] || this._table(false);

  while (cells.length < this.columns.length) cells.push('');
  table.rows.push(cells);
  return table;
};

TabbedAggResponseWriter.prototype.split = function (agg, buckets, block) {
  let self = this;

  if (!self.canSplit) {
    throw new Error('attempted to split when splitting is disabled');
  }

  self._removeAggFromColumns(agg);

  buckets.forEach(function (bucket, key) {
    // find the existing split that we should extend
    let tableGroup = _.find(self.splitStack[0].tables, { aggConfig: agg, key: key });
    // create the split if it doesn't exist yet
    if (!tableGroup) tableGroup = self._table(true, agg, key);

    let splitAcr = false;
    if (self.asAggConfigResults) {
      splitAcr = self._injectParentSplit(agg, key);
    }

    // push the split onto the stack so that it will receive written tables
    self.splitStack.unshift(tableGroup);

    // call the block
    if (_.isFunction(block)) block.call(self, bucket, key);

    // remove the split from the stack
    self.splitStack.shift();
    splitAcr && _.pull(self.acrStack, splitAcr);
  });
};

TabbedAggResponseWriter.prototype._removeAggFromColumns = function (agg) {
  let i = _.findIndex(this.columns, function (col) {
    return col.aggConfig === agg;
  });

  // we must have already removed this column
  if (i === -1) return;

  this.columns.splice(i, 1);

  if (this.minimalColumns) return;

  // hierarchical vis creats additional columns for each bucket
  // we will remove those too
  let mCol = this.columns.splice(i, 1).pop();
  let mI = _.findIndex(this.aggStack, function (agg) {
    return agg === mCol.aggConfig;
  });

  if (mI > -1) this.aggStack.splice(mI, 1);
};

/**
 * When a split is found while building the aggConfigResult tree, we
 * want to push the split into the tree at another point. Since each
 * branch in the tree is a double-linked list we need do some special
 * shit to pull this off.
 *
 * @private
 * @param {AggConfig} - The agg which produced the split bucket
 * @param {any} - The value which identifies the bucket
 * @return {SplitAcr} - the AggConfigResult created for the split bucket
 */
TabbedAggResponseWriter.prototype._injectParentSplit = function (agg, key) {
  let oldList = this.acrStack;
  let newList = this.acrStack = [];

  // walk from right to left through the old stack
  // and move things to the new stack
  let injected = false;

  if (!oldList.length) {
    injected = new SplitAcr(agg, null, key);
    newList.unshift(injected);
    return injected;
  }

  // walk from right to left, emptying the previous list
  while (oldList.length) {
    let acr = oldList.pop();

    // ignore other splits
    if (acr instanceof SplitAcr) {
      newList.unshift(acr);
      continue;
    }

    // inject the split
    if (!injected) {
      injected = new SplitAcr(agg, newList[0], key);
      newList.unshift(injected);
    }

    let newAcr = new AggConfigResult(acr.aggConfig, newList[0], acr.value, getKey(acr));
    newList.unshift(newAcr);

    // and replace the acr in the row buffer if its there
    let rowI = this.rowBuffer.indexOf(acr);
    if (rowI > -1) {
      this.rowBuffer[rowI] = newAcr;
    }
  }

  return injected;
};

TabbedAggResponseWriter.prototype.response = function () {
  let columns = this.columns;
  // columns.map(function (col) {
  //   col.title = col.aggConfig.makeLabel();
  // });

  // walk the tree and write the columns to each table
  (function step(table, group) {
    if (table.tables) table.tables.forEach(step);
    else table.columns = columns.slice(0);
  }(this.root));

  if (this.canSplit) return this.root;

  let table = this.root.tables[0];
  if (!table) return;

  delete table.$parent;
  return table;
};



function TableGroup() {
  this.aggConfig = null;
  this.key = null;
  this.title = null;
  this.tables = [];
}

TableGroup.prototype.field = function () {
  if (this.aggConfig) return this.aggConfig.field();
};

TableGroup.prototype.fieldFormatter = function () {
  if (this.aggConfig) return this.aggConfig.fieldFormatter();
};

let i = 0;

function AggConfigResult(aggConfig, parent, value, key) {
  this.key = key;
  this.value = value;
  this.aggConfig = aggConfig;
  this.$parent = parent;
  this.$order = ++i;

  if (aggConfig.schema.group === 'buckets') {
    this.type = 'bucket';
  } else {
    this.type = 'metric';
  }
}

/**
 * Returns an array of the aggConfigResult and parents up the branch
 * @returns {array} Array of aggConfigResults
 */
AggConfigResult.prototype.getPath = function () {
  return (function walk(result, path) {
    path.unshift(result);
    if (result.$parent) return walk(result.$parent, path);
    return path;
  }(this, []));
};

/**
 * Returns an Elasticsearch filter that represents the result.
 * @returns {object} Elasticsearch filter
 */
AggConfigResult.prototype.createFilter = function () {
  return this.aggConfig.createFilter(this.key);
};

AggConfigResult.prototype.toString = function (contentType) {
  return this.aggConfig.fieldFormatter(contentType)(this.value);
};

AggConfigResult.prototype.valueOf = function () {
  return this.value;
};

export function parse(vis, esResponse) {
  try {
    var topLevelBucket = Object.assign({},  esResponse.aggregations, {
      doc_count: esResponse.hits.total
    });
    const _vis = _.clone(vis, true);
    var writer = new TabbedAggResponseWriter(_vis, respOpts);
    collectBucket(writer, topLevelBucket);
    return writer;
    // for (let tableGroup of writer.root.tables) {
    //   for (let table of tableGroup.tables) {
    //     var _rows = [];
    //     for (let row of table.rows) {
    //       _rows.push(row.map ( i => i.value));
    //     }
    //
    //     console.log(_rows)
    //   }
    // }
  } catch (e) {
    console.error(e);
  }
}


// console.log(writer);
