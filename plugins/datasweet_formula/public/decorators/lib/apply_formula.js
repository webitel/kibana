import { each, filter, find, get, isArray, isEmpty, isObject, map } from 'lodash';
import { FormulaParserProvider } from './formula_parser';

export function AggResponseFormulaProvider(Private)  {
  const aggTypeFormulaId = 'datasweet_formula';
  const FormulaParser = Private(FormulaParserProvider);
  const parser = new FormulaParser(true);
  const varPrefix = 'agg';

  function hasFormulas(cols) {
    return find(cols, 'aggConfig.type.name', aggTypeFormulaId) !== undefined;
  }

  function rowValue(val) {
    return isObject(val) ? val.value : val;
  }

  function extractSeriesAndFormulas(rows, cols) {
    const res = { series: {}, formulas:[] };

    each(cols, (c, i)=> {
      const colIndex = i;
      const key = varPrefix + c.aggConfig.id.replace('.', '_');

      // formula ?
      if (c.aggConfig.type.name === aggTypeFormulaId) {
        const f = get(c.aggConfig.params, 'formula', '').trim();
        if (f.length > 0) {
          res.formulas.push({
            colIndex,
            key,
            compiled: (f.length > 0 ? parser.parse(f) : null)
          });
        }
        res.series[key] = null;
      }

      // series.
      else {
        // TODO: analyze all formulas to build dependencies
        res.series[key] = map(rows, r => rowValue(r[colIndex]));
      }
    });

    return res;
  };

  function compute(datas) {
    const computed = {};
    each(datas.formulas, f => {
      let res = null;
      try {
        res = f.compiled.evaluate(datas.series);
        computed[f.colIndex] = { value: res, isArray: isArray(res) };
      } catch (e) {
        res = null;
        // console.log('ERROR', e);
      }
      datas.series[f.key] = res;
    });
    return computed;
  };

  function mutate(table, columns) {
    if (table.tables) {
      table.tables.forEach(t => mutate(t, columns));
    } else {
      const datas = extractSeriesAndFormulas(table.rows, columns);

      // Compute and stocks
      const computed = compute(datas);

      // Apply
      if (!isEmpty(computed)) {
        const isRowValue = isObject(table.rows[0][0]);
        each(table.rows, (row, i) => {
          each(computed, (data, colIndex) => {
            const value = (data.isArray ? data.value[i] || null : data.value);
            if (isRowValue) {
              row[colIndex].value = value;
            } else {
              row[colIndex] = value;
            }
          });
        });
      }
    }
  };

  return function apply(columns, resp) {
    if (columns.length === 0  || resp.length === 0 || !hasFormulas(columns)) return;
    mutate(resp, columns);
  };
};