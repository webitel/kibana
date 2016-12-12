/**
 * Created by igor on 12.12.16.
 */

"use strict";

import {writeFile} from 'fs'

export function makeFile(writer, params, cb) {
  let data = `${params.name}\n\n`;

  function makeTable(table) {
    const _cols = [];
    for (let col of writer.aggStack) {
      if (col.schema.name === 'split' || !col.enabled) continue;
      _cols.push(col.params.customLabel || col.params.field || col.type);
    }
    data += `${_cols.join(',')}\n`;
    for (let row of table.rows) {
      data += row.map ( i => i.value).join(',') + '\n';
    }

    data += '\n\n\n'
  }

  for (let group of writer.root.tables) {

    if (group.tables instanceof Array) {
      for (let table of group.tables) {
        makeTable(table);
      }
    } else {
      makeTable(group);
    }


  }

  // const fileName = `/tmp/${params.name}_${Date.now()}.csv`;
  //
  // writeFile(fileName, data, e => {
  //   console.log('save');
  //   cb(null, {})
  // });
  // return;
  return cb(null, {
    filename: `${params.name}_${Date.now()}.csv`,
    content: new Buffer(data,'utf-8')
  })
}
