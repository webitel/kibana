/**
 * Created by igor on 08.11.16.
 */

"use strict";

const module = require('ui/modules').get('kibana/webitel/exports');
const fileSaver = require('plugins/exports/lib/fileSaver');

const jsZIP = require('jszip');
const jsZIPUtils = require('jszip-utils');
const async = require('async');

module.service('webitelExportDataService', (es, Notifier, webitelRecords) => {
    let isProcess = false;
    let data = [];
    let fsApi = null;

    webitelRecords.then(api => {
        fsApi = api;
    });

    const notify = new Notifier({
        location: 'Export'
    });

    function parseTimeStamp (timestamp) {
        var d = new Date(timestamp);
        return `=DATE(${d.getFullYear()},${d.getMonth() + 1},${d.getDate()})+TIME(${d.getHours()},${d.getMinutes()},${d.getSeconds()})`
    }

    var status = {
        data: {
            total: 0,
            load: 0
        },
        draw: 0
    };

    function getStatus() {
        return status;
    }

    function scrollData(scrollId, cb) {
        es.scroll({
            body: {
                scroll_id:  scrollId,
                scroll: '5m'
            }
        }, (err, res) => {
            if (err) {
                notify.error(err);
                isProcess = false;
            }

            return cb(err, res);
        })
    }

    function deleteScroll(scroll) {

    }

    var tableToExcel = function(table){
        var fullTemplate = "";
        fullTemplate += `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>Kibana Webitel</Author>
    <LastAuthor>Kibana Webitel</LastAuthor>
    <Created>${new Date().toISOString()}</Created>
    <Version>14.00</Version>
  </DocumentProperties>
  <OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office">
    <AllowPNG/>
  </OfficeDocumentSettings>
  <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
    <WindowHeight>12840</WindowHeight>
    <WindowWidth>27795</WindowWidth>
    <WindowTopX>480</WindowTopX>
    <WindowTopY>60</WindowTopY>
    <ProtectStructure>False</ProtectStructure>
    <ProtectWindows>False</ProtectWindows>
  </ExcelWorkbook>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Calibri" x:CharSet="204" x:Family="Swiss" ss:Size="11"
            ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="s62">
      <NumberFormat ss:Format="@"/>
    </Style>
    <Style ss:ID="s63">
      <NumberFormat ss:Format="Short Date"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Discover1">
    <Table ss:DefaultRowHeight="15">
      ${table}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Header x:Margin="0.3"/>
        <Footer x:Margin="0.3"/>
        <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
      </PageSetup>
      <Unsynced/>
      <Print>
        <ValidPrinterInfo/>
        <PaperSizeIndex>9</PaperSizeIndex>
        <HorizontalResolution>600</HorizontalResolution>
        <VerticalResolution>600</VerticalResolution>
      </Print>
      <Selected/>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <Panes>
        <Pane>
          <Number>3</Number>
        </Pane>
        <Pane>
          <Number>2</Number>
        </Pane>
      </Panes>
      <ProtectObjects>False</ProtectObjects>
      <ProtectScenarios>False</ProtectScenarios>
    </WorksheetOptions>
  </Worksheet>
</Workbook>
`;

        var blob = new Blob([fullTemplate], {
            // https://github.com/faisalman/simple-excel-js/blob/master/src/simple-excel.js
            type: "application/vnd.ms-excel"
        });
        fileSaver.saveAs(blob, `${new Date().toLocaleDateString()}.xls`);
    };

    const CSV_SEPARATOR = ';';

    function tableToCsv(table) {

        var blob = new Blob([table], {
            type: "text/csv"
        });
        fileSaver.saveAs(blob, `${new Date().toLocaleDateString()}.csv`);
    }

    var EXPORT_FN = {
        excel: function (scroll, params) {
            var scrollId = scroll._scroll_id;
            var text = '';
            var rowsCount = 0;
            var col = params.columns;
            var dateCol = params.dateColumns || [];

            col.forEach(() => {
                text += `<Column ss:AutoFitWidth="0"/>\n`;
            });

            text += `<Row ss:AutoFitHeight="0">\n`;

            col.forEach((c) => {
                text += `<Cell ss:StyleID="s62"><Data ss:Type="String">${c}</Data></Cell>`;
            });
            text += '</Row>\n';

            function draw(err, res) {
                if (err) {
                    console.error(err);
                    notify.error(err);
                    isProcess = false;
                    return;
                }

                try {

                    res.hits.hits.forEach((v) => {
                        rowsCount++;
                        text += '<Row ss:AutoFitHeight="0">';

                        col.forEach(c => {
                            if (~dateCol.indexOf(c) && v.fields.hasOwnProperty(c)) {
                                text += `<Cell ss:StyleID="s63" ss:Formula="${parseTimeStamp(v.fields[c].pop())}"><Data ss:Type="DateTime"></Data></Cell>`;
                            } else {
                                text += `<Cell><Data ss:Type="String">${v.fields.hasOwnProperty(c) ? v.fields[c][0] : '-' }</Data></Cell>`;
                            }
                        });

                        text += '</Row>';
                    });

                    if (rowsCount >= res.hits.total) {
                        isProcess = false;
                        tableToExcel(text, 'export.xls');
                    } else {
                        scrollData(scrollId, draw);
                    }
                } catch (e) {
                    isProcess = false;
                    notify.error(e);
                }

            }

            draw(null, scroll);
        },
        csv: function (scroll, params) {
            var scrollId = scroll._scroll_id;
            var text = '';
            var rowsCount = 0;
            var col = params.columns;
            var dateCol = params.dateColumns || [];

            text += `${col.join(CSV_SEPARATOR)}`;

            function draw(err, res) {
                if (err) {
                    console.error(err);
                    notify.error(err);
                    isProcess = false;
                    return;
                }

                try {

                    res.hits.hits.forEach((v) => {
                        text += '\n';
                        rowsCount++;
                        col.forEach(c => {
                            if (~dateCol.indexOf(c) && v.fields.hasOwnProperty(c)) {
                                text += new Date(v.fields[c].pop()).toLocaleString().replace(new RegExp(CSV_SEPARATOR, 'g'), ',');
                            } else {
                                text += v.fields.hasOwnProperty(c) ? v.fields[c][0] : '-';
                            }
                            text += CSV_SEPARATOR;
                        });
                    });

                    if (rowsCount >= res.hits.total) {
                        isProcess = false;
                        tableToCsv(text);
                    } else {
                        scrollData(scrollId, draw);
                    }
                } catch (e) {
                    isProcess = false;
                    notify.error(e);
                }

            }

            draw(null, scroll);
        },
        files: function (scroll, params) {
            var rowsCount = 0;
            var scrollId = scroll._scroll_id;
            var zip = new jsZIP();

            function loadFiles(arr, cb) {
                async.eachSeries(
                    arr,
                    function (i, cb) {
                        async.eachSeries(
                            i._source.recordings,
                            function (file, cb) {
                                var pref = file['content-type'] === "application/pdf" ? "pdf" :"mp3";
                                var uri = fsApi.getRecordUri(file.uuid, file.name, file["createdOn"], pref);
                                jsZIPUtils.getBinaryContent(uri, function (e, data) {
                                    if (e) {
                                        return cb();
                                    }
                                    zip.file(file["createdOn"] + '_' + file.name + '.' + pref, data);
                                    cb();
                                });
                            },
                            cb
                        )
                    },
                    cb
                );
            }

            function onData(err, res) {
                if (err) {
                    notify.error(err);
                    isProcess = false;
                    return;
                }

                rowsCount += res.hits.hits.length;

                loadFiles(res.hits.hits, e => {
                    if (e) {
                        notify.error(e);
                        isProcess = false;
                        return;
                    }

                    if (rowsCount >= res.hits.total) {
                        isProcess = false;
                        zip.generateAsync({type:"blob"}).then(function(content) {
                            fileSaver.saveAs(content, `${new Date().toLocaleDateString()}.zip`);
                        });
                    } else {
                        scrollData(scrollId, onData);
                    }
                });
            }

            onData(null, scroll);
        }
    };


    function process(searchSource, params, cb) {
        if (isProcess) return cb(new Error('Process export running'));

        if (!params)
            return cb(new Error('Bad params'));

        if (!EXPORT_FN.hasOwnProperty(params.to)) {
            return cb(new Error('Bad type export to ' + params.to || ''  ));
        }
        isProcess = true;
        data = [];
        searchSource._flatten()
            .then(query => {
                params.dateColumns = _.clone(query.body.docvalue_fields);

                function getFilter(query) {
                    var f = _.clone(query);
                    if (params.to === "files") {
                        try {
                            f.bool.must.push({
                                exists: {"field": "recordings"}
                            })
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    return f;
                }

                function getBody(query) {
                    if (params.to === "files") {
                        return {
                            "_source": "recordings",
                            query: getFilter(query.body.query)
                        }
                    } else {
                        return {
                            docvalue_fields: query.body.docvalue_fields.concat(params.columns),
                            stored_fields: query.body.docvalue_fields.concat(params.columns),
                            // _source: params.columns,
                            query: getFilter(query.body.query),
                            sort: _.clone(query.body.sort)
                        }
                    }
                }
                es.search({
                    index: query.index.title,
                    scroll: '5m',
                    size: 10000,
                    body: getBody(query)
                }, (err, res) => {
                    if (err) {
                        isProcess = false;
                        return cb(err);
                    }
                    if (query.index.timeFieldName) {
                        params.columns.unshift(query.index.timeFieldName);
                        params.topFieldDate = true;
                    }
                    try {
                        EXPORT_FN[params.to](res, params);
                    } catch (e) {
                        isProcess = false;
                        notify.error(e);
                    }
                    return cb(null);
                });
            })
            .catch(e => {
                console.error(e);
                notify.error(e);
                isProcess = false;
                return cb(e)
            });
    }

    return {
        export: process,
        getStatus: getStatus
    }
});
