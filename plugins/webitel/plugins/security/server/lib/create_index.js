/**
 * Created by igor on 11.06.16.
 */

import async from 'async';

export function validateIndex (server, domainName, cb) {
    const client = server.plugins.elasticsearch.getCluster('admin').getClient();

    const config = server.config();
    const index = `${config.get('kibana.index') || '.kibana'}-${domainName}`;
    const buildNum = config.get('pkg.buildNum') || '8467';
    const id = 'config:' + (config.get('pkg.version') || '6.2.2');
    console.log(index, id);
    client.get({
        index: index,
        type: "doc",
        id: id
    }, (err, exists) => {
        console.dir(err, {depth: 5});

        if (err && err.status !== 404)
            return console.error(err);

        if (!exists || !exists.found) {
            console.log(`Try create index`);

          createIndex(client, index)
            .then(
              () => {
                createConfig(client, index, id, buildNum, domainName)
                  .then(
                    () => {
                      createIndexPattern(client, index, (err, res) => {
                        console.log('RESULT:');
                        console.log(err, res);
                        if (err) {
                          setupError(err)
                        }
                      })
                    },
                    setupError
                  )
              },
              setupError
            );
        }
    })
}

function setupError(err) {
    console.log(err)
}

function createIndex(client, index) {
    console.log(`Create index ${index}`);
    return client.indices.create({
        index: index,
        body: {
          "settings": {
            "index": {
              "number_of_shards": "1",
              "number_of_replicas": "1"
            }
          },
          "mappings": {
        "doc": {
          "properties": {
            "type": {
              "type": "keyword"
            },
            "server": {
              "dynamic": "strict",
              "properties": {
                "uuid": {
                  "type": "keyword"
                }
              }
            },
            "url": {
              "dynamic": "strict",
              "properties": {
                "accessCount": {
                  "type": "long"
                },
                "accessDate": {
                  "type": "date"
                },
                "createDate": {
                  "type": "date"
                },
                "url": {
                  "type": "text",
                  "fields": {
                    "keyword": {
                      "type": "keyword",
                      "ignore_above": 2048
                    }
                  }
                }
              }
            },
            "search": {
              "dynamic": "strict",
              "properties": {
                "columns": {
                  "type": "keyword"
                },
                "description": {
                  "type": "text"
                },
                "hits": {
                  "type": "integer"
                },
                "kibanaSavedObjectMeta": {
                  "properties": {
                    "searchSourceJSON": {
                      "type": "text"
                    }
                  }
                },
                "sort": {
                  "type": "keyword"
                },
                "title": {
                  "type": "text"
                },
                "version": {
                  "type": "integer"
                }
              }
            },
            "visualization": {
              "dynamic": "strict",
              "properties": {
                "description": {
                  "type": "text"
                },
                "kibanaSavedObjectMeta": {
                  "properties": {
                    "searchSourceJSON": {
                      "type": "text"
                    }
                  }
                },
                "savedSearchId": {
                  "type": "keyword"
                },
                "title": {
                  "type": "text"
                },
                "uiStateJSON": {
                  "type": "text"
                },
                "version": {
                  "type": "integer"
                },
                "visState": {
                  "type": "text"
                }
              }
            },
            "index-pattern": {
              "dynamic": "strict",
              "properties": {
                "fieldFormatMap": {
                  "type": "text"
                },
                "fields": {
                  "type": "text"
                },
                "intervalName": {
                  "type": "keyword"
                },
                "notExpandable": {
                  "type": "boolean"
                },
                "sourceFilters": {
                  "type": "text"
                },
                "timeFieldName": {
                  "type": "keyword"
                },
                "title": {
                  "type": "text"
                }
              }
            },
            "config": {
              "dynamic": "true",
              "properties": {
                "buildNum": {
                  "type": "keyword"
                }
              }
            },
            "dashboard": {
              "dynamic": "strict",
              "properties": {
                "description": {
                  "type": "text"
                },
                "hits": {
                  "type": "integer"
                },
                "kibanaSavedObjectMeta": {
                  "properties": {
                    "searchSourceJSON": {
                      "type": "text"
                    }
                  }
                },
                "optionsJSON": {
                  "type": "text"
                },
                "panelsJSON": {
                  "type": "text"
                },
                "refreshInterval": {
                  "properties": {
                    "display": {
                      "type": "keyword"
                    },
                    "pause": {
                      "type": "boolean"
                    },
                    "section": {
                      "type": "integer"
                    },
                    "value": {
                      "type": "integer"
                    }
                  }
                },
                "timeFrom": {
                  "type": "keyword"
                },
                "timeRestore": {
                  "type": "boolean"
                },
                "timeTo": {
                  "type": "keyword"
                },
                "title": {
                  "type": "text"
                },
                "uiStateJSON": {
                  "type": "text"
                },
                "version": {
                  "type": "integer"
                }
              }
            },
            "timelion-sheet": {
              "dynamic": "strict",
              "properties": {
                "description": {
                  "type": "text"
                },
                "hits": {
                  "type": "integer"
                },
                "kibanaSavedObjectMeta": {
                  "properties": {
                    "searchSourceJSON": {
                      "type": "text"
                    }
                  }
                },
                "timelion_chart_height": {
                  "type": "integer"
                },
                "timelion_columns": {
                  "type": "integer"
                },
                "timelion_interval": {
                  "type": "keyword"
                },
                "timelion_other_interval": {
                  "type": "keyword"
                },
                "timelion_rows": {
                  "type": "integer"
                },
                "timelion_sheet": {
                  "type": "text"
                },
                "title": {
                  "type": "text"
                },
                "version": {
                  "type": "integer"
                }
              }
            }
          }
        }
      }
        }
    });
}

function createConfig(client, index, id, buildNum, domainName) {
    console.log(`Create config ${index}`);
    return client.create({
        index: index,
        type: "doc",
        id: id,
        body: {
          type: "config",
          config: {
            buildNum: buildNum,
            defaultIndex: "87302100-18ac-11e8-89c5-f756010dd369",
            domainName: domainName || null
            // "defaultIndex": "cdr-*",
          }
        }
    });
}

function createIndexPattern(client, index, cb) {
    console.log(`Create pattern ${index}`);
    createDefaultVisualizations(client, index);

    async.forEachOf(DEFAULT_INDEX_PATTERNS, function (item, key, callback) {
      console.log(`Create: ${item._id}`)

      client.create({
        id: item._id,
        index: index,
        type: 'doc',
        body: item._source
      }, callback);
    }, cb);
}

function createDefaultVisualizations(client, index) {

  DEFAULT_SETTINGS_DATA.forEach( i => {
        client.create({
            id: i._id,
            index: index,
            type: 'doc',
            body: i._source
        });
    });
}

const DEFAULT_INDEX_PATTERNS = [
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "index-pattern:91bb4190-18ac-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "index-pattern",
      "updated_at": "2018-03-02T10:51:19.005Z",
      "index-pattern": {
        "title": "cdr-b-*",
        "timeFieldName": "created_time",
        "fields": "[{\"name\":\"_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"answersec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"billsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.ani\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.aniii\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.rdnis\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.username\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.bridged_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hangup_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hold_accum_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.last_hold_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.profile_created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_media_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.resurrect_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.transfer_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"direction\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"domain_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"extension\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause_q850\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"holdsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"leg\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.city\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country_code\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.geo\",\"type\":\"geo_point\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"originate_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"parent_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"pinnedItems\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"post_data.comment\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"post_data.vote\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"presence_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"progresssec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_audio\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_video\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cancel_reason\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.exit_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.joined_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.wait_duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.content-type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.createdOn\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.path\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.private\",\"type\":\"boolean\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.size\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.type\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"transfer_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.absolute_codec_string\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_role\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_state\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_status_description\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.accountcode\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.call_completed_elsewhere\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.callgroup\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_bridged\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_export_vars\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_pre_answer_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_session_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_joined_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.chat_proto\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_member_id\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.copy_json_cdr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.customer_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_areacode\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_language\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.dsdada\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_callee_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.ent_originate_aleg_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.group_dial_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.hold_events\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.hold_stamp\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.is_outbound\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.kk\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_var_clobber\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.loopback_bowout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.loopback_bowout_on_execute\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_early_media\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_timeout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originating_leg_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originator\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originator_codec\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.outbound_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.outbound_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.proto_specific_hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.record_stereo\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_media_flow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.rtp_use_codec_fmtp\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.secondary_recovery_module\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_destination_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_gateway_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_failure_phrase\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_failure_status\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_nat_detected\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_outgoing_contact_uri\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_profile_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_contact\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_via\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_host\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_display\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_params\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_user_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sofia_profile_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.text_media_flow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.toll_allow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.transfer_fallback_extension\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_context\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_scheme\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_read_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_write_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.w_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_call_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_data\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.zrtp_sas2_string\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"waitsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"billsec_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['billsec'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"waitsec_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['waitsec'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"holdsec_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['holdsec'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"hangup_side\",\"type\":\"string\",\"count\":0,\"scripted\":true,\"script\":\"doc['hangup_disposition'].value == 'send_bye' ? 'Recieve hangup' : doc['hangup_disposition'].value == 'recv_bye' ? 'Send hangup' : doc['hangup_disposition'].value == 'recv_refuse' ? 'Send refuse' : doc['hangup_disposition'].value == 'send_refuse' ? 'Recieve refuse' : doc['hangup_disposition'].value == 'send_cancel' ? 'Recieve cancel' : doc['hangup_disposition'].value == 'recv_cancel' ? 'Send cancel' : 'Unknown'\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false}]",
        "fieldFormatMap": "{\"billsec_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"waitsec_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"holdsec_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}}}"
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "index-pattern:54d48570-1bb3-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "index-pattern",
      "updated_at": "2018-03-02T10:50:23.847Z",
      "index-pattern": {
        "title": "accounts-*",
        "timeFieldName": "created_time",
        "fields": "[{\"name\":\"-\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"account\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"cc\",\"type\":\"boolean\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"description\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"display_status\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration\",\"type\":\"number\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"end_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"extension\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"presence_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"state\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"ws\",\"type\":\"boolean\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration_time\",\"type\":\"number\",\"count\":1,\"scripted\":true,\"script\":\"doc['duration'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"created_datetime\",\"type\":\"date\",\"count\":0,\"scripted\":true,\"script\":\"doc['created_time'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false}]",
        "fieldFormatMap": "{\"duration_human\":{\"id\":\"number\",\"params\":{\"pattern\":\"'00:00:00'\"}},\"duration_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"created_datetime\":{\"id\":\"date\",\"params\":{\"pattern\":\"D MMM, HH:mm\"}}}"
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "index-pattern:87302100-18ac-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "index-pattern",
      "updated_at": "2018-03-02T12:09:54.787Z",
      "index-pattern": {
        "title": "cdr-a-*",
        "timeFieldName": "created_time",
        "fields": "[{\"name\":\"_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"answersec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"billsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.ani\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.aniii\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.rdnis\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.username\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.bridged_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hangup_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hold_accum_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.last_hold_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.profile_created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_media_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.resurrect_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.transfer_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"direction\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"domain_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"extension\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause_q850\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"holdsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"leg\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.city\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country_code\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.geo\",\"type\":\"geo_point\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"originate_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"parent_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"pinnedItems\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"pinned_items\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"post_data.comment\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"post_data.vote\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"presence_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"progresssec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_audio\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_video\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cancel_reason\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.exit_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.joined_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.wait_duration\",\"type\":\"number\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings._id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.content-type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.createdOn\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.hash\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.path\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.private\",\"type\":\"boolean\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.size\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.type\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"transfer_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.DP_MATCH\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.RECORD_DISCARDED\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_role\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_state\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.accountcode\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.bpm_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.bridge_to\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.call_completed_elsewhere\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.call_timeout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.callgroup\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.campon\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.campon_hold_music\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.campon_retries\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.campon_sleep\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.campon_timeout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_bridged\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_cancel_reason\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_export_vars\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_answered_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_canceled_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_joined_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_terminated_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.chat_proto\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_ghost\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_member_id\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_moderator\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.customer_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_areacode\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_language\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.dialed_group\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.dsdada\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_callee_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.group_dial_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.igor\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.is_outbound\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.kk\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_var_clobber\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.number_alias\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.open\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_early_media\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_failed_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_signal_bond\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.outbound_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.outbound_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.pre_transfer_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.preserve_originated_vars\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.proto_specific_hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.record_stereo\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_ip_reported\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_media_flow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_port_reported\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_video_media_flow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.requested_domain_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.requested_user_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.rtp_auto_adjust_audio\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.rtp_use_codec_fmtp\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.secondary_recovery_module\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_auth_realm\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_auth_username\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_authorized\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_auto_answer\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_destination_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_from_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_full_route\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_failure_phrase\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_failure_status\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_number_alias\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_outgoing_contact_uri\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_profile_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_contact\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_via\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_host\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_subject\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_display\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_params\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_user_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sofia_profile_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.text_media_flow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.toll_allow\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.transfer_fallback_extension\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_context\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_scheme\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_read_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_write_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.w_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_call_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_data\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"waitsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['duration'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"billsec_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['billsec'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"queue_waiting_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['queue.wait_duration'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"queue_duration_time\",\"type\":\"number\",\"count\":0,\"scripted\":true,\"script\":\"doc['queue.duration'].value\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"hangup_side\",\"type\":\"string\",\"count\":0,\"scripted\":true,\"script\":\"doc['hangup_disposition'].value == 'send_bye' ? 'Recieve hangup' : doc['hangup_disposition'].value == 'recv_bye' ? 'Send hangup' : doc['hangup_disposition'].value == 'recv_refuse' ? 'Send refuse' : doc['hangup_disposition'].value == 'send_refuse' ? 'Recieve refuse' : doc['hangup_disposition'].value == 'send_cancel' ? 'Recieve cancel' : doc['hangup_disposition'].value == 'recv_cancel' ? 'Send cancel' : 'Unknown'\",\"lang\":\"painless\",\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false}]",
        "fieldFormatMap": "{\"duration_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"billsec_human\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"billsec_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"queue_waiting_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}},\"queue_duration_time\":{\"id\":\"number\",\"params\":{\"pattern\":\"00:00:00\"}}}"
      }
    }
  }
];

const DEFAULT_SETTINGS_DATA = [
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:028d9430-1a57-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-02-25T18:09:24.211Z",
      "visualization": {
        "title": "Extensions",
        "visState": "{\"title\":\"Extensions\",\"type\":\"input_control_vis\",\"params\":{\"controls\":[{\"id\":\"1519582130868\",\"indexPattern\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"fieldName\":\"extension\",\"label\":\"Extensions\",\"type\":\"list\",\"options\":{\"type\":\"terms\",\"multiselect\":true,\"size\":50,\"order\":\"desc\"}}],\"updateFiltersOnChange\":false,\"useTimeFilter\":false},\"aggs\":[]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:b8bc1dc0-1bca-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-02-27T14:30:13.148Z",
      "visualization": {
        "title": "Accounts",
        "visState": "{\"title\":\"Accounts\",\"type\":\"input_control_vis\",\"params\":{\"controls\":[{\"id\":\"1519741763070\",\"indexPattern\":\"54d48570-1bb3-11e8-89c5-f756010dd369\",\"fieldName\":\"account\",\"label\":\"Accounts\",\"type\":\"list\",\"options\":{\"type\":\"terms\",\"multiselect\":false,\"size\":20,\"order\":\"desc\"}}],\"updateFiltersOnChange\":false,\"useTimeFilter\":false},\"aggs\":[]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:9512b950-1d33-11e8-a450-b5c720fcaa2b",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T10:30:10.256Z",
      "visualization": {
        "title": "Work log of the Call Center agents",
        "visState": "{\"aggs\":[{\"enabled\":true,\"id\":\"2\",\"params\":{\"customLabel\":\"Agent\",\"field\":\"account\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"order\":\"desc\",\"orderBy\":\"_term\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"size\":100},\"schema\":\"bucket\",\"type\":\"terms\"},{\"enabled\":true,\"id\":\"10\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"10-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:\\\"Logged In\\\"\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Last In\",\"customMetric\":{\"enabled\":true,\"id\":\"10-metric\",\"params\":{\"field\":\"created_datetime\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"max\"}},\"schema\":\"metric\",\"type\":\"max_bucket\"},{\"enabled\":true,\"id\":\"9\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"9-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:\\\"Logged Out\\\"\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Last Out\",\"customMetric\":{\"enabled\":true,\"id\":\"9-metric\",\"params\":{\"field\":\"created_datetime\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"max\"}},\"schema\":\"metric\",\"type\":\"min_bucket\"},{\"enabled\":true,\"id\":\"3\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"3-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"cc:true\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"At work\",\"customMetric\":{\"enabled\":true,\"id\":\"3-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"5\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"5-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"(display_status:ISBUSY || display_status:Receiving ) && cc:true\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Busy\",\"customMetric\":{\"enabled\":true,\"id\":\"5-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"6\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"6-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:ONHOOK && cc:true\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Idle\",\"customMetric\":{\"enabled\":true,\"id\":\"6-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"7\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"7-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:\\\"On Break\\\" || status:ONBREAK\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"On Break\",\"customMetric\":{\"enabled\":true,\"id\":\"7-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"8\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"8-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:DND\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"DND\",\"customMetric\":{\"enabled\":true,\"id\":\"8-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"}],\"params\":{\"computedColumns\":[{\"alignment\":\"left\",\"applyTemplate\":false,\"enabled\":true,\"format\":\"number\",\"formula\":\"col4 / col5\",\"label\":\"Load\",\"pattern\":\"'0.%'\",\"template\":\"<b>{{value}}</b>\"}],\"filterBarHideable\":false,\"filterBarWidth\":\"25%\",\"filterCaseSensitive\":false,\"hideExportLinks\":false,\"perPage\":10,\"showFilterBar\":false,\"showMeticsAtAllLevels\":false,\"showPartialRows\":false,\"showTotal\":false,\"sort\":{\"columnIndex\":1,\"direction\":\"desc\"},\"totalFunc\":\"avg\"},\"title\":\"Work log of the Call Center agents\",\"type\":\"enhanced-table\"}",
        "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":1,\"direction\":\"desc\"}}}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"54d48570-1bb3-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:e763a650-1a55-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T10:14:16.822Z",
      "visualization": {
        "title": "Inbound calls from queue by extensions",
        "visState": "{\"aggs\":[{\"enabled\":true,\"id\":\"2\",\"params\":{\"customLabel\":\"Extension\",\"field\":\"extension\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"size\":20},\"schema\":\"bucket\",\"type\":\"terms\"},{\"enabled\":true,\"id\":\"1\",\"params\":{\"customLabel\":\"Calls\"},\"schema\":\"metric\",\"type\":\"count\"},{\"enabled\":true,\"id\":\"3\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"3-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Answered\",\"customMetric\":{\"enabled\":true,\"id\":\"3-metric\",\"params\":{\"customLabel\":\"\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"count\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"4\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"4-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:<=1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Missed\",\"customMetric\":{\"enabled\":true,\"id\":\"4-metric\",\"params\":{},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"count\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"6\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"6-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Total hold\",\"customMetric\":{\"enabled\":true,\"id\":\"6-metric\",\"params\":{\"field\":\"holdsec_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"5\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"5-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Total talk\",\"customMetric\":{\"enabled\":true,\"id\":\"5-metric\",\"params\":{\"field\":\"billsec_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"}],\"params\":{\"perPage\":5,\"showMeticsAtAllLevels\":false,\"showPartialRows\":false,\"showTotal\":true,\"sort\":{\"columnIndex\":3,\"direction\":\"desc\"},\"totalFunc\":\"sum\"},\"title\":\"Inbound calls from queue by extensions\",\"type\":\"table\"}",
        "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":3,\"direction\":\"desc\"}}}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"$state\":{\"store\":\"appState\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"hangup_cause\",\"negate\":true,\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"},\"type\":\"phrase\",\"value\":\"LOSE_RACE\"},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}}},{\"$state\":{\"store\":\"appState\"},\"exists\":{\"field\":\"queue.name\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"queue.name\",\"negate\":false,\"type\":\"exists\",\"value\":\"exists\"}}],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:72f166b0-1ac6-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T10:10:30.173Z",
      "visualization": {
        "title": "Hangup disposition for queue calls",
        "visState": "{\"title\":\"Hangup disposition for queue calls\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"},\"valueAxis\":null},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100,\"filter\":false,\"rotate\":90},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Calls\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Calls\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":20,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Extension\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"hangup_side\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":105,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Hangup disposition\"}}]}",
        "uiStateJSON": "{\"vis\":{\"colors\":{\"recv_refuse\":\"#EA6460\",\"recv_bye\":\"#F2C96D\",\"send_bye\":\"#9AC48A\",\"send_cancel\":\"#BA43A9\",\"Recieve hangup\":\"#7EB26D\",\"Send hangup\":\"#806EB7\",\"Send refuse\":\"#BF1B00\",\"Recieve cancel\":\"#E5AC0E\"},\"legendOpen\":true}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"queue.name\",\"value\":\"exists\"},\"exists\":{\"field\":\"queue.name\"},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"hangup_cause\",\"value\":\"LOSE_RACE\",\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:a90fcc40-1a54-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T10:25:47.230Z",
      "visualization": {
        "title": "Answered/Missed calls from queue",
        "visState": "{\"title\":\"Answered/Missed calls from queue\",\"type\":\"heatmap\",\"params\":{\"type\":\"heatmap\",\"addTooltip\":true,\"addLegend\":true,\"enableHover\":true,\"legendPosition\":\"right\",\"times\":[],\"colorsNumber\":6,\"colorSchema\":\"Blues\",\"setColorRange\":false,\"colorsRange\":[],\"invertColors\":false,\"percentageMode\":false,\"valueAxes\":[{\"show\":false,\"id\":\"ValueAxis-1\",\"type\":\"value\",\"scale\":{\"type\":\"linear\",\"defaultYExtents\":false},\"labels\":{\"show\":false,\"rotate\":270,\"color\":\"#555\"}}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"group\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>0\"},\"label\":\"Answered\"},{\"input\":{\"query\":\"billsec:0\"},\"label\":\"Missed\"}]}},{\"id\":\"3\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"created_time\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Time\"}}]}",
        "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 2\":\"rgb(247,251,255)\",\"2 - 4\":\"rgb(214,230,244)\",\"4 - 5\":\"rgb(171,208,230)\",\"5 - 7\":\"rgb(107,174,214)\",\"7 - 9\":\"rgb(55,135,192)\",\"9 - 10\":\"rgb(16,92,164)\"},\"legendOpen\":false},\"spy\":null}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"queue.name\",\"value\":\"exists\"},\"exists\":{\"field\":\"queue.name\"},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"hangup_cause\",\"value\":\"LOSE_RACE\",\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },

  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:3d426650-1e0d-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T11:40:52.392Z",
      "visualization": {
        "title": "Inbound talk metrics (CC)",
        "visState": "{\"aggs\":[{\"enabled\":true,\"id\":\"1\",\"params\":{\"customLabel\":\"Total talk time\",\"field\":\"billsec_time\"},\"schema\":\"metric\",\"type\":\"sum\"},{\"enabled\":true,\"id\":\"2\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"2-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Avg talk time\",\"customMetric\":{\"enabled\":true,\"id\":\"2-metric\",\"params\":{\"field\":\"billsec_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"avg\"}},\"schema\":\"metric\",\"type\":\"avg_bucket\"},{\"enabled\":true,\"id\":\"3\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"3-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"holdsec:>1\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Avg hold time\",\"customMetric\":{\"enabled\":true,\"id\":\"3-metric\",\"params\":{\"field\":\"holdsec_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"avg\"}},\"schema\":\"metric\",\"type\":\"avg_bucket\"},{\"enabled\":true,\"id\":\"4\",\"params\":{\"customLabel\":\"Avg waiting time\",\"field\":\"waitsec_time\"},\"schema\":\"metric\",\"type\":\"avg\"}],\"params\":{\"addLegend\":false,\"addTooltip\":true,\"metric\":{\"colorSchema\":\"Green to Red\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"invertColors\":false,\"labels\":{\"show\":true},\"metricColorMode\":\"None\",\"percentageMode\":false,\"style\":{\"bgColor\":false,\"bgFill\":\"#000\",\"fontSize\":44,\"labelColor\":false,\"subText\":\"\"},\"useRanges\":false},\"type\":\"metric\"},\"title\":\"Inbound talk metrics (CC)\",\"type\":\"metric\"}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"$state\":{\"store\":\"appState\"},\"exists\":{\"field\":\"queue.name\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"queue.name\",\"negate\":false,\"type\":\"exists\",\"value\":\"exists\"}}],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },

  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:2e25fdd0-1e0d-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T11:30:59.245Z",
      "visualization": {
        "title": "Inbound talk metrics",
        "visState": "{\"title\":\"Inbound talk metrics\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":60}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"sum\",\"schema\":\"metric\",\"params\":{\"field\":\"billsec_time\",\"customLabel\":\"Total talk time\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metric\",\"params\":{\"field\":\"billsec_time\",\"customLabel\":\"Avg talk time\"}}]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:60ca8900-1e16-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T12:37:35.018Z",
      "visualization": {
        "title": "Inbound calls by extensions per time (CC)",
        "visState": "{\"title\":\"Inbound calls by extensions per time (CC)\",\"type\":\"heatmap\",\"params\":{\"type\":\"heatmap\",\"addTooltip\":true,\"addLegend\":true,\"enableHover\":false,\"legendPosition\":\"right\",\"times\":[],\"colorsNumber\":5,\"colorSchema\":\"Reds\",\"setColorRange\":false,\"colorsRange\":[],\"invertColors\":false,\"percentageMode\":false,\"valueAxes\":[{\"show\":false,\"id\":\"ValueAxis-1\",\"type\":\"value\",\"scale\":{\"type\":\"linear\",\"defaultYExtents\":false},\"labels\":{\"show\":false,\"rotate\":0,\"color\":\"#555\"}}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"created_time\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Call time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Extension\"}}]}",
        "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 3\":\"rgb(255,245,240)\",\"3 - 5\":\"rgb(253,202,181)\",\"5 - 8\":\"rgb(252,138,106)\",\"8 - 10\":\"rgb(241,68,50)\",\"10 - 12\":\"rgb(188,20,26)\"},\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"hangup_cause\",\"value\":\"LOSE_RACE\",\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"queue.name\",\"value\":\"exists\"},\"exists\":{\"field\":\"queue.name\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:5e732850-1e12-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T12:08:07.765Z",
      "visualization": {
        "title": "Abandoned calls with waiting time 5/20 sec (CC)",
        "visState": "{\"title\":\"Abandoned calls with waiting time 5/20 sec (CC)\",\"type\":\"area\",\"params\":{\"type\":\"area\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100,\"rotate\":0},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Abandoned calls\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"area\",\"mode\":\"stacked\",\"data\":{\"label\":\"Abandoned calls\",\"id\":\"1\"},\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"cardinal\",\"valueAxis\":\"ValueAxis-1\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"top\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Abandoned calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"segment\",\"params\":{\"filters\":[{\"input\":{\"query\":\"queue.wait_duration:<=5\"},\"label\":\"<= 5 sec\"},{\"input\":{\"query\":\"queue.wait_duration:>5 && queue.wait_duration:<=20\"},\"label\":\"<= 20 sec\"},{\"input\":{\"query\":\"queue.wait_duration:>20\"},\"label\":\"> 20 sec\"}]}}]}",
        "uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"queue.name\",\"value\":\"exists\"},\"exists\":{\"field\":\"queue.name\"},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"extension\",\"value\":\"exists\"},\"exists\":{\"field\":\"extension\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:ecf39b40-1e13-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T12:20:19.458Z",
      "visualization": {
        "title": "Unique inbound calls",
        "visState": "{\"title\":\"Unique inbound calls\",\"type\":\"enhanced-table\",\"params\":{\"perPage\":5,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":0,\"direction\":\"desc\"},\"showTotal\":false,\"totalFunc\":\"sum\",\"computedColumns\":[{\"label\":\"Unique\",\"formula\":\"col2 / col1\",\"format\":\"number\",\"pattern\":\"0.%\",\"alignment\":\"left\",\"applyTemplate\":false,\"template\":\"{{value}}\",\"enabled\":true}],\"hideExportLinks\":false,\"showFilterBar\":false,\"filterCaseSensitive\":false,\"filterBarHideable\":false,\"filterBarWidth\":\"25%\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Total calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"bucket\",\"params\":{\"field\":\"created_time\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Call time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"caller_id_number\",\"customLabel\":\"Unique calls\"}}]}",
        "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":0,\"direction\":\"desc\"}}}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"direction\",\"value\":\"inbound\",\"params\":{\"query\":\"inbound\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"direction\":{\"query\":\"inbound\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:ee4fb570-1ac9-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T12:22:17.365Z",
      "visualization": {
        "title": "The last 50 abandoned calls (CC)",
        "visState": "{\"title\":\"The last 50 abandoned calls (CC)\",\"type\":\"table\",\"params\":{\"perPage\":6,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":0,\"direction\":\"desc\"},\"showTotal\":true,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"bucket\",\"params\":{\"field\":\"created_time\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"caller_id_number\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":50,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"CallerID\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metric\",\"params\":{\"field\":\"queue_waiting_time\",\"customLabel\":\"Avg waiting at the queue\"}},{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Calls\"}}]}",
        "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":0,\"direction\":\"desc\"}}}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"$state\":{\"store\":\"appState\"},\"exists\":{\"field\":\"queue.name\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"key\":\"queue.name\",\"negate\":false,\"type\":\"exists\",\"value\":\"exists\"}},{\"$state\":{\"store\":\"appState\"},\"exists\":{\"field\":\"extension\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"key\":\"extension\",\"negate\":true,\"type\":\"exists\",\"value\":\"exists\"}}],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:7eda5cf0-1e10-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T11:56:19.130Z",
      "visualization": {
        "title": "Answered calls by top 10 extension (CC)",
        "visState": "{\"title\":\"Answered calls by top 10 extension (CC)\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":false,\"labels\":{\"show\":true,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Answered calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Extension\"}}]}",
        "uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"billsec\",\"value\":\"0\",\"params\":{\"query\":0,\"type\":\"phrase\"}},\"query\":{\"match\":{\"billsec\":{\"query\":0,\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"queue.name\",\"value\":\"exists\"},\"exists\":{\"field\":\"queue.name\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:ff0c3960-1d3a-11e8-a450-b5c720fcaa2b",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:01:21.069Z",
      "visualization": {
        "title": "On break",
        "visState": "{\"title\":\"On break\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"bottom\",\"isDonut\":true,\"labels\":{\"show\":true,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"sum\",\"schema\":\"metric\",\"params\":{\"field\":\"duration_time\",\"customLabel\":\"Duration\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"display_status\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"On Break\"}}]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"54d48570-1bb3-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"query\":\"display_status:\\\"On Break\\\" || status:ONBREAK\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:f8d4c840-1ad9-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:47:47.450Z",
      "visualization": {
        "title": "Avg duration by extension (CC)",
        "visState": "{\"title\":\"Avg duration by extension (CC)\",\"type\":\"horizontal_bar\",\"params\":{\"addLegend\":true,\"addTimeMarker\":false,\"addTooltip\":true,\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"labels\":{\"filter\":false,\"rotate\":0,\"show\":true,\"truncate\":200},\"position\":\"left\",\"scale\":{\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{},\"type\":\"category\"}],\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"},\"valueAxis\":\"ValueAxis-1\"},\"legendPosition\":\"right\",\"seriesParams\":[{\"data\":{\"id\":\"1\",\"label\":\"Avg talk time\"},\"drawLinesBetweenPoints\":true,\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"histogram\",\"valueAxis\":\"ValueAxis-1\"},{\"data\":{\"id\":\"4\",\"label\":\"Avg waiting time\"},\"drawLinesBetweenPoints\":true,\"interpolate\":\"linear\",\"lineWidth\":3,\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"line\",\"valueAxis\":\"ValueAxis-1\"},{\"data\":{\"id\":\"3\",\"label\":\"Avg hold time\"},\"drawLinesBetweenPoints\":true,\"interpolate\":\"linear\",\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"area\",\"valueAxis\":\"ValueAxis-1\"}],\"times\":[],\"type\":\"histogram\",\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"labels\":{\"filter\":true,\"rotate\":0,\"show\":true,\"truncate\":100},\"name\":\"LeftAxis-1\",\"position\":\"bottom\",\"scale\":{\"mode\":\"normal\",\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{\"text\":\"Sum of billsec\"},\"type\":\"value\"}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"avg_bucket\",\"schema\":\"metric\",\"params\":{\"customBucket\":{\"id\":\"1-bucket\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"bucketAgg\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]}},\"customMetric\":{\"id\":\"1-metric\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metricAgg\",\"params\":{\"field\":\"billsec_time\"}},\"customLabel\":\"Avg talk time\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metric\",\"params\":{\"field\":\"waitsec_time\",\"customLabel\":\"Avg waiting time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"avg_bucket\",\"schema\":\"metric\",\"params\":{\"customBucket\":{\"id\":\"3-bucket\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"bucketAgg\",\"params\":{\"filters\":[{\"input\":{\"query\":\"holdsec:>1\"},\"label\":\"\"}]}},\"customMetric\":{\"id\":\"3-metric\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metricAgg\",\"params\":{\"field\":\"holdsec_time\"}},\"customLabel\":\"Avg hold time\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":20,\"order\":\"desc\",\"orderBy\":\"_term\",\"customLabel\":\"Extension\"}}]}",
        "uiStateJSON": "{\"vis\":{\"colors\":{\"Average billsec\":\"#7EB26D\",\"Average holdsec\":\"#EAB839\",\"Average waitsec\":\"#1F78C1\",\"Sum of billsec\":\"#0A50A1\",\"Sum of holdsec\":\"#EAB839\",\"Duration\":\"#7EB26D\",\"Waiting time\":\"#5195CE\",\"Hold time\":\"#F2C96D\",\"Avg talk time\":\"#7EB26D\",\"Avg waiting time\":\"#58140C\",\"Avg hold time\":\"#967302\"},\"legendOpen\":true}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"$state\":{\"store\":\"appState\"},\"exists\":{\"field\":\"queue.name\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"queue.name\",\"negate\":false,\"type\":\"exists\",\"value\":\"exists\"}},{\"$state\":{\"store\":\"appState\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"hangup_cause\",\"negate\":true,\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"},\"type\":\"phrase\",\"value\":\"LOSE_RACE\"},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}}}],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:b23dfcf0-1e1a-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:24:35.418Z",
      "visualization": {
        "title": "Users work log",
        "visState": "{\"aggs\":[{\"enabled\":true,\"id\":\"2\",\"params\":{\"customLabel\":\"Agent\",\"field\":\"account\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"order\":\"desc\",\"orderBy\":\"_term\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"size\":100},\"schema\":\"bucket\",\"type\":\"terms\"},{\"enabled\":true,\"id\":\"10\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"10-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"cc:true\"},\"label\":\"\"},{\"input\":{\"query\":\"\"}}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"CallCenter\",\"customMetric\":{\"enabled\":true,\"id\":\"10-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"9\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"9-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:NONREG\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Not Ready\",\"customMetric\":{\"enabled\":true,\"id\":\"9-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"6\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"6-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:ONHOOK\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Ready\",\"customMetric\":{\"enabled\":true,\"id\":\"6-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"5\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"5-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:ISBUSY || display_status:Receiving\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"Busy\",\"customMetric\":{\"enabled\":true,\"id\":\"5-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"7\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"7-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:\\\"On Break\\\" || status:ONBREAK\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"On Break\",\"customMetric\":{\"enabled\":true,\"id\":\"7-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"},{\"enabled\":true,\"id\":\"8\",\"params\":{\"customBucket\":{\"enabled\":true,\"id\":\"8-bucket\",\"params\":{\"filters\":[{\"input\":{\"query\":\"display_status:DND\"},\"label\":\"\"}]},\"schema\":{\"aggFilter\":[],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"bucketAgg\",\"params\":[],\"title\":\"Bucket Agg\"},\"type\":\"filters\"},\"customLabel\":\"DND\",\"customMetric\":{\"enabled\":true,\"id\":\"8-metric\",\"params\":{\"field\":\"duration_time\"},\"schema\":{\"aggFilter\":[\"!top_hits\",\"!percentiles\",\"!percentile_ranks\",\"!median\",\"!std_dev\",\"!sum_bucket\",\"!avg_bucket\",\"!min_bucket\",\"!max_bucket\",\"!derivative\",\"!moving_avg\",\"!serial_diff\",\"!cumulative_sum\"],\"deprecate\":false,\"editor\":false,\"group\":\"none\",\"max\":null,\"min\":0,\"name\":\"metricAgg\",\"params\":[],\"title\":\"Metric Agg\"},\"type\":\"sum\"}},\"schema\":\"metric\",\"type\":\"sum_bucket\"}],\"params\":{\"computedColumns\":[{\"alignment\":\"left\",\"applyTemplate\":false,\"enabled\":true,\"format\":\"number\",\"formula\":\"col4 / col3\",\"label\":\"Load\",\"pattern\":\"'0.%'\",\"template\":\"<b>{{value}}</b>\"}],\"filterBarHideable\":false,\"filterBarWidth\":\"25%\",\"filterCaseSensitive\":false,\"hideExportLinks\":false,\"perPage\":10,\"showFilterBar\":false,\"showMeticsAtAllLevels\":false,\"showPartialRows\":false,\"showTotal\":false,\"sort\":{\"columnIndex\":1,\"direction\":\"desc\"},\"totalFunc\":\"avg\"},\"title\":\"Users work log\",\"type\":\"enhanced-table\"}",
        "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":1,\"direction\":\"desc\"}}}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"54d48570-1bb3-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "dashboard:4c3a0af0-1e1c-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "dashboard",
      "updated_at": "2018-03-02T13:28:49.048Z",
      "dashboard": {
        "title": "Users",
        "hits": 0,
        "description": "Today dashboard",
        "panelsJSON": "[{\"gridData\":{\"h\":4,\"i\":\"1\",\"w\":7,\"x\":0,\"y\":4},\"id\":\"b23dfcf0-1e1a-11e8-b146-59ad78f31f77\",\"panelIndex\":\"1\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":4,\"i\":\"2\",\"w\":7,\"x\":0,\"y\":0},\"id\":\"f839adc0-1e1b-11e8-b146-59ad78f31f77\",\"panelIndex\":\"2\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":4,\"i\":\"3\",\"w\":5,\"x\":7,\"y\":4},\"id\":\"ff0c3960-1d3a-11e8-a450-b5c720fcaa2b\",\"panelIndex\":\"3\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"embeddableConfig\":{\"vis\":{\"legendOpen\":false}},\"gridData\":{\"h\":4,\"i\":\"4\",\"w\":5,\"x\":7,\"y\":0},\"id\":\"6f0b8170-1e1d-11e8-b146-59ad78f31f77\",\"panelIndex\":\"4\",\"type\":\"visualization\",\"version\":\"6.2.2\"}]",
        "optionsJSON": "{\"darkTheme\":false,\"hidePanelTitles\":false,\"useMargins\":true}",
        "version": 1,
        "timeRestore": true,
        "timeTo": "now/d",
        "timeFrom": "now/d",
        "refreshInterval": {
          "display": "Off",
          "pause": false,
          "value": 0
        },
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[],\"highlightAll\":true,\"version\":true}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:f839adc0-1e1b-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:18:24.612Z",
      "visualization": {
        "title": "Calls by extensions per hour",
        "visState": "{\"title\":\"Calls by extensions per hour\",\"type\":\"heatmap\",\"params\":{\"type\":\"heatmap\",\"addTooltip\":true,\"addLegend\":true,\"enableHover\":false,\"legendPosition\":\"right\",\"times\":[],\"colorsNumber\":10,\"colorSchema\":\"Yellow to Red\",\"setColorRange\":false,\"colorsRange\":[],\"invertColors\":false,\"percentageMode\":false,\"valueAxes\":[{\"show\":false,\"id\":\"ValueAxis-1\",\"type\":\"value\",\"scale\":{\"type\":\"linear\",\"defaultYExtents\":false},\"labels\":{\"show\":false,\"rotate\":0,\"color\":\"#555\"}}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"created_time\",\"interval\":\"h\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Call time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Extension\"}}]}",
        "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 3\":\"rgb(255,255,204)\",\"3 - 5\":\"rgb(255,241,170)\",\"5 - 8\":\"rgb(254,225,135)\",\"8 - 10\":\"rgb(254,201,101)\",\"10 - 12\":\"rgb(254,171,73)\",\"12 - 15\":\"rgb(253,141,60)\",\"15 - 17\":\"rgb(252,91,46)\",\"17 - 20\":\"rgb(237,47,34)\",\"20 - 22\":\"rgb(212,16,32)\",\"22 - 24\":\"rgb(176,0,38)\"},\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:6f0b8170-1e1d-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:28:06.926Z",
      "visualization": {
        "title": "Extensions by call direction",
        "visState": "{\"aggs\":[{\"enabled\":true,\"id\":\"1\",\"params\":{\"customLabel\":\"Calls\"},\"schema\":\"metric\",\"type\":\"count\"},{\"enabled\":true,\"id\":\"2\",\"params\":{\"field\":\"extension\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"size\":10},\"schema\":\"segment\",\"type\":\"terms\"},{\"enabled\":true,\"id\":\"3\",\"params\":{\"field\":\"direction\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"size\":5},\"schema\":\"group\",\"type\":\"terms\"}],\"params\":{\"addLegend\":true,\"addTimeMarker\":false,\"addTooltip\":true,\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"labels\":{\"show\":true,\"truncate\":100},\"position\":\"bottom\",\"scale\":{\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{},\"type\":\"category\"}],\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"legendPosition\":\"right\",\"orderBucketsBySum\":true,\"seriesParams\":[{\"data\":{\"id\":\"1\",\"label\":\"Calls\"},\"drawLinesBetweenPoints\":true,\"mode\":\"stacked\",\"show\":\"true\",\"showCircles\":true,\"type\":\"histogram\",\"valueAxis\":\"ValueAxis-1\"}],\"times\":[],\"type\":\"histogram\",\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"labels\":{\"filter\":false,\"rotate\":0,\"show\":true,\"truncate\":100},\"name\":\"LeftAxis-1\",\"position\":\"left\",\"scale\":{\"mode\":\"normal\",\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{\"text\":\"Calls\"},\"type\":\"value\"}]},\"title\":\"Extensions by call direction\",\"type\":\"histogram\"}",
        "uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:af1792d0-1e1e-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:37:45.645Z",
      "visualization": {
        "title": "Calls by direction",
        "visState": "{\"title\":\"Calls by direction\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":40}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"direction\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:10281850-1e20-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:46:09.365Z",
      "visualization": {
        "title": "Top 10 hangup causes",
        "visState": "{\"title\":\"Top 10 hangup causes\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":false,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"hangup_cause\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "dashboard:f278b760-1a55-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "dashboard",
      "updated_at": "2018-03-02T14:06:14.075Z",
      "dashboard": {
        "title": "Inbound calls (CC)",
        "hits": 0,
        "description": "inbound calls from the queues",
        "panelsJSON": "[{\"gridData\":{\"h\":2,\"i\":\"3\",\"w\":6,\"x\":6,\"y\":16},\"id\":\"028d9430-1a57-11e8-89c5-f756010dd369\",\"panelIndex\":\"3\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"embeddableConfig\":{\"spy\":null,\"vis\":{\"defaultColors\":{\"0 - 1\":\"rgb(255,245,240)\",\"1 - 2\":\"rgb(253,212,194)\",\"2 - 3\":\"rgb(252,160,130)\",\"3 - 4\":\"rgb(251,106,74)\",\"4 - 5\":\"rgb(227,47,39)\",\"5 - 5\":\"rgb(177,18,24)\"},\"legendOpen\":false}},\"gridData\":{\"h\":2,\"i\":\"4\",\"w\":12,\"x\":0,\"y\":0},\"id\":\"a90fcc40-1a54-11e8-89c5-f756010dd369\",\"panelIndex\":\"4\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":4,\"i\":\"5\",\"w\":6,\"x\":6,\"y\":5},\"id\":\"e763a650-1a55-11e8-89c5-f756010dd369\",\"panelIndex\":\"5\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":4,\"i\":\"6\",\"w\":6,\"x\":6,\"y\":9},\"id\":\"72f166b0-1ac6-11e8-89c5-f756010dd369\",\"panelIndex\":\"6\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":4,\"i\":\"7\",\"w\":6,\"x\":0,\"y\":9},\"id\":\"ee4fb570-1ac9-11e8-89c5-f756010dd369\",\"panelIndex\":\"7\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":3,\"i\":\"8\",\"w\":6,\"x\":6,\"y\":2},\"id\":\"f8d4c840-1ad9-11e8-89c5-f756010dd369\",\"panelIndex\":\"8\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":3,\"i\":\"9\",\"w\":6,\"x\":0,\"y\":2},\"id\":\"3d426650-1e0d-11e8-b146-59ad78f31f77\",\"panelIndex\":\"9\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"embeddableConfig\":{\"vis\":{\"legendOpen\":false}},\"gridData\":{\"h\":4,\"i\":\"10\",\"w\":6,\"x\":0,\"y\":5},\"id\":\"7eda5cf0-1e10-11e8-b146-59ad78f31f77\",\"panelIndex\":\"10\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":3,\"i\":\"11\",\"w\":6,\"x\":0,\"y\":13},\"id\":\"5e732850-1e12-11e8-b146-59ad78f31f77\",\"panelIndex\":\"11\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"gridData\":{\"h\":3,\"i\":\"12\",\"w\":6,\"x\":6,\"y\":13},\"id\":\"ecf39b40-1e13-11e8-b146-59ad78f31f77\",\"panelIndex\":\"12\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"embeddableConfig\":{\"vis\":{\"defaultColors\":{\"0 - 3\":\"rgb(255,245,240)\",\"10 - 12\":\"rgb(188,20,26)\",\"3 - 5\":\"rgb(253,202,181)\",\"5 - 8\":\"rgb(252,138,106)\",\"8 - 10\":\"rgb(241,68,50)\"},\"legendOpen\":false}},\"gridData\":{\"h\":3,\"i\":\"13\",\"w\":6,\"x\":0,\"y\":16},\"id\":\"60ca8900-1e16-11e8-b146-59ad78f31f77\",\"panelIndex\":\"13\",\"type\":\"visualization\",\"version\":\"6.2.2\"}]",
        "optionsJSON": "{\"darkTheme\":false,\"hidePanelTitles\":false,\"useMargins\":true}",
        "version": 1,
        "timeRestore": true,
        "timeTo": "now/d",
        "timeFrom": "now/d",
        "refreshInterval": {
          "display": "Off",
          "pause": false,
          "value": 0
        },
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[],\"highlightAll\":true,\"version\":true}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:52e2c460-1e20-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:48:01.318Z",
      "visualization": {
        "title": "Avg duration by extension",
        "visState": "{\"title\":\"Avg duration by extension\",\"type\":\"horizontal_bar\",\"params\":{\"addLegend\":true,\"addTimeMarker\":false,\"addTooltip\":true,\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"labels\":{\"filter\":false,\"rotate\":0,\"show\":true,\"truncate\":200},\"position\":\"left\",\"scale\":{\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{},\"type\":\"category\"}],\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"},\"valueAxis\":\"ValueAxis-1\"},\"legendPosition\":\"right\",\"seriesParams\":[{\"data\":{\"id\":\"1\",\"label\":\"Avg talk time\"},\"drawLinesBetweenPoints\":true,\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"histogram\",\"valueAxis\":\"ValueAxis-1\"},{\"data\":{\"id\":\"4\",\"label\":\"Avg waiting time\"},\"drawLinesBetweenPoints\":true,\"interpolate\":\"linear\",\"lineWidth\":3,\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"line\",\"valueAxis\":\"ValueAxis-1\"},{\"data\":{\"id\":\"3\",\"label\":\"Avg hold time\"},\"drawLinesBetweenPoints\":true,\"interpolate\":\"linear\",\"mode\":\"normal\",\"show\":true,\"showCircles\":true,\"type\":\"area\",\"valueAxis\":\"ValueAxis-1\"}],\"times\":[],\"type\":\"histogram\",\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"labels\":{\"filter\":true,\"rotate\":0,\"show\":true,\"truncate\":100},\"name\":\"LeftAxis-1\",\"position\":\"bottom\",\"scale\":{\"mode\":\"normal\",\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{\"text\":\"Sum of billsec\"},\"type\":\"value\"}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"avg_bucket\",\"schema\":\"metric\",\"params\":{\"customBucket\":{\"id\":\"1-bucket\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"bucketAgg\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:>1\"},\"label\":\"\"}]}},\"customMetric\":{\"id\":\"1-metric\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metricAgg\",\"params\":{\"field\":\"billsec_time\"}},\"customLabel\":\"Avg talk time\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metric\",\"params\":{\"field\":\"waitsec_time\",\"customLabel\":\"Avg waiting time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"avg_bucket\",\"schema\":\"metric\",\"params\":{\"customBucket\":{\"id\":\"3-bucket\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"bucketAgg\",\"params\":{\"filters\":[{\"input\":{\"query\":\"holdsec:>1\"},\"label\":\"\"}]}},\"customMetric\":{\"id\":\"3-metric\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metricAgg\",\"params\":{\"field\":\"holdsec_time\"}},\"customLabel\":\"Avg hold time\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"extension\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":20,\"order\":\"desc\",\"orderBy\":\"_term\",\"customLabel\":\"Extension\"}}]}",
        "uiStateJSON": "{\"vis\":{\"colors\":{\"Average billsec\":\"#7EB26D\",\"Average holdsec\":\"#EAB839\",\"Average waitsec\":\"#1F78C1\",\"Sum of billsec\":\"#0A50A1\",\"Sum of holdsec\":\"#EAB839\",\"Duration\":\"#7EB26D\",\"Waiting time\":\"#5195CE\",\"Hold time\":\"#F2C96D\",\"Avg talk time\":\"#7EB26D\",\"Avg waiting time\":\"#58140C\",\"Avg hold time\":\"#967302\"},\"legendOpen\":true}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"$state\":{\"store\":\"appState\"},\"meta\":{\"alias\":null,\"disabled\":false,\"index\":\"91bb4190-18ac-11e8-89c5-f756010dd369\",\"key\":\"hangup_cause\",\"negate\":true,\"params\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"},\"type\":\"phrase\",\"value\":\"LOSE_RACE\"},\"query\":{\"match\":{\"hangup_cause\":{\"query\":\"LOSE_RACE\",\"type\":\"phrase\"}}}}],\"query\":{\"language\":\"lucene\",\"query\":\"\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "dashboard:758fdf70-1e20-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "dashboard",
      "updated_at": "2018-03-02T14:03:06.682Z",
      "dashboard": {
        "title": "CDR",
        "hits": 0,
        "description": "Today calls",
        "panelsJSON": "[{\"panelIndex\":\"1\",\"gridData\":{\"x\":0,\"y\":0,\"w\":6,\"h\":2,\"i\":\"1\"},\"id\":\"af1792d0-1e1e-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"2\",\"gridData\":{\"x\":0,\"y\":12,\"w\":6,\"h\":3,\"i\":\"2\"},\"id\":\"69104a40-1e12-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"4\",\"gridData\":{\"x\":6,\"y\":0,\"w\":6,\"h\":2,\"i\":\"4\"},\"id\":\"61376580-1e1f-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"6\",\"gridData\":{\"x\":0,\"y\":6,\"w\":6,\"h\":3,\"i\":\"6\"},\"id\":\"10281850-1e20-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"7\",\"gridData\":{\"x\":6,\"y\":6,\"w\":6,\"h\":3,\"i\":\"7\"},\"id\":\"52e2c460-1e20-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"8\",\"gridData\":{\"x\":0,\"y\":2,\"w\":12,\"h\":4,\"i\":\"8\"},\"id\":\"f839adc0-1e1b-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"9\",\"gridData\":{\"x\":6,\"y\":12,\"w\":6,\"h\":3,\"i\":\"9\"},\"id\":\"ecf39b40-1e13-11e8-b146-59ad78f31f77\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"10\",\"gridData\":{\"x\":0,\"y\":9,\"w\":12,\"h\":3,\"i\":\"10\"},\"version\":\"6.2.2\",\"type\":\"visualization\",\"id\":\"458c15d0-1e22-11e8-b146-59ad78f31f77\"}]",
        "optionsJSON": "{\"darkTheme\":false,\"hidePanelTitles\":false,\"useMargins\":true}",
        "version": 1,
        "timeRestore": true,
        "timeTo": "now/d",
        "timeFrom": "now/d",
        "refreshInterval": {
          "display": "Off",
          "pause": false,
          "value": 0
        },
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[],\"highlightAll\":true,\"version\":true}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "dashboard:ff6edf00-1bca-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "dashboard",
      "updated_at": "2018-03-02T14:06:34.380Z",
      "dashboard": {
        "title": "Account's status",
        "hits": 0,
        "description": "Callcenter accout's status",
        "panelsJSON": "[{\"panelIndex\":\"1\",\"gridData\":{\"x\":6,\"y\":5,\"w\":6,\"h\":2,\"i\":\"1\"},\"id\":\"b8bc1dc0-1bca-11e8-89c5-f756010dd369\",\"title\":\"\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"2\",\"gridData\":{\"x\":0,\"y\":5,\"w\":6,\"h\":4,\"i\":\"2\"},\"embeddableConfig\":{\"vis\":{\"legendOpen\":true}},\"id\":\"ff0c3960-1d3a-11e8-a450-b5c720fcaa2b\",\"type\":\"visualization\",\"version\":\"6.2.2\"},{\"panelIndex\":\"3\",\"gridData\":{\"x\":0,\"y\":0,\"w\":12,\"h\":5,\"i\":\"3\"},\"id\":\"9512b950-1d33-11e8-a450-b5c720fcaa2b\",\"type\":\"visualization\",\"version\":\"6.2.2\"}]",
        "optionsJSON": "{\"darkTheme\":false,\"hidePanelTitles\":false,\"useMargins\":true}",
        "version": 1,
        "timeRestore": true,
        "timeTo": "now/d",
        "timeFrom": "now/d",
        "refreshInterval": {
          "display": "Off",
          "pause": false,
          "value": 0
        },
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[],\"highlightAll\":true,\"version\":true}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:458c15d0-1e22-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T14:01:57.933Z",
      "visualization": {
        "title": "Unique inbound calls timeline",
        "visState": "{\"title\":\"Unique inbound calls timeline\",\"type\":\"line\",\"params\":{\"type\":\"line\",\"grid\":{\"categoryLines\":true,\"style\":{\"color\":\"#eee\"},\"valueAxis\":\"ValueAxis-1\"},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"line\",\"mode\":\"normal\",\"data\":{\"label\":\"inbound calls\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"cardinal\"},{\"show\":true,\"mode\":\"normal\",\"type\":\"area\",\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"linear\",\"lineWidth\":null,\"data\":{\"id\":\"3\",\"label\":\"Unique inbound calls\"},\"valueAxis\":\"ValueAxis-1\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"inbound calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"created_time\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Call time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"caller_id_number\",\"customLabel\":\"Unique inbound calls\"}}]}",
        "uiStateJSON": "{\"vis\":{\"colors\":{\"Unique inbound calls\":\"#F4D598\",\"inbound calls\":\"#447EBC\"}},\"spy\":null}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"direction\",\"value\":\"inbound\",\"params\":{\"query\":\"inbound\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"direction\":{\"query\":\"inbound\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:69104a40-1e12-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:56:03.169Z",
      "visualization": {
        "title": "Abandoned calls on the 5/20 sec",
        "visState": "{\"title\":\"Abandoned calls on the 5/20 sec\",\"type\":\"area\",\"params\":{\"type\":\"area\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100,\"rotate\":0},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Abandoned calls\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"area\",\"mode\":\"stacked\",\"data\":{\"label\":\"Abandoned calls\",\"id\":\"1\"},\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"cardinal\",\"valueAxis\":\"ValueAxis-1\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"top\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Abandoned calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"segment\",\"params\":{\"filters\":[{\"input\":{\"query\":\"billsec:<=5\"},\"label\":\"<= 5 sec\"},{\"input\":{\"query\":\"billsec:>5 && billsec:<=20\"},\"label\":\"<= 20 sec\"},{\"input\":{\"query\":\"billsec:>20\"},\"label\":\"> 20 sec\"}]}}]}",
        "uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":true,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"extension\",\"value\":\"exists\"},\"exists\":{\"field\":\"extension\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "visualization:61376580-1e1f-11e8-b146-59ad78f31f77",
    "_score": 1.0,
    "_source": {
      "type": "visualization",
      "updated_at": "2018-03-02T13:50:53.854Z",
      "visualization": {
        "title": "Answered inbound calls",
        "visState": "{\"title\":\"Answered inbound calls\",\"type\":\"metric\",\"params\":{\"addLegend\":false,\"addTooltip\":true,\"metric\":{\"colorSchema\":\"Green to Red\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"invertColors\":false,\"labels\":{\"show\":true},\"metricColorMode\":\"None\",\"percentageMode\":false,\"style\":{\"bgColor\":false,\"bgFill\":\"#000\",\"fontSize\":30,\"labelColor\":false,\"subText\":\"\"},\"useRanges\":false},\"type\":\"metric\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Answered calls\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"avg\",\"schema\":\"metric\",\"params\":{\"field\":\"billsec_time\",\"customLabel\":\"Avg talk time\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"sum\",\"schema\":\"metric\",\"params\":{\"field\":\"billsec_time\",\"customLabel\":\"Total talk time\"}}]}",
        "uiStateJSON": "{}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"filter\":[{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"direction\",\"value\":\"inbound\",\"params\":{\"query\":\"inbound\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"direction\":{\"query\":\"inbound\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"87302100-18ac-11e8-89c5-f756010dd369\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"exists\",\"key\":\"extension\",\"value\":\"exists\"},\"exists\":{\"field\":\"extension\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    }
  },
  {
    "_index": ".kibana",
    "_type": "doc",
    "_id": "index-pattern:ef87f140-18ae-11e8-89c5-f756010dd369",
    "_score": 1.0,
    "_source": {
      "type": "index-pattern",
      "updated_at": "2018-03-06T11:55:45.370Z",
      "index-pattern": {
        "title": "cdr*",
        "timeFieldName": "created_time",
        "fields": "[{\"name\":\"_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"count\":0,\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"answersec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"billsec\",\"type\":\"number\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.ani\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.aniii\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.rdnis\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.username\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.caller_profile.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.bridged_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hangup_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.hold_accum_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.last_hold_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.profile_created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_media_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.progress_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.resurrect_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"callflow.times.transfer_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"created_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"destination_number\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"direction\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"domain_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"extension\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"gateway\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_cause_q850\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"hangup_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"holdsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"leg\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.city\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.country_code\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.geo\",\"type\":\"geo_point\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"locations.type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"network_addr\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"originate_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"parent_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"pinnedItems\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"presence_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"progresssec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_audio\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"quality_percentage_video\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.answered_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cancel_reason\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.hangup_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.joined_time\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"queue.wait_duration\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings._id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.content-type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.createdOn\",\"type\":\"date\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.hash\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.path\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.private\",\"type\":\"boolean\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.size\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.type\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"recordings.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"source\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"transfer_disposition\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"uuid\",\"type\":\"string\",\"count\":1,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_role\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_state\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.account_status_description\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_bridged\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_type\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_agent_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_export_vars\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_pre_answer_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_session_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_member_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_answered_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_joined_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_queue_terminated_epoch\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.cc_side\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.chat_proto\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.conference_member_id\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.customer_id\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.default_language\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.domain_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.dsdada\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_callee_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.effective_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.group_dial_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.hold_events\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.hold_stamp\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.igor\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.is_outbound\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.kk\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.last_sent_display_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.local_video_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.loopback_bowout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.loopback_bowout_on_execute\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.original_destination_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_early_media\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originate_timeout\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originating_leg_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.origination_caller_id_number\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originator\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.originator_codec\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.outbound_caller_id_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.proto_specific_hangup_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtcp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_ip\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.remote_audio_rtp_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.rtp_use_codec_fmtp\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.secondary_recovery_module\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_auto_answer\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_destination_url\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_from_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_invite_failure_status\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_nat_detected\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_outgoing_contact_uri\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_profile_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_contact\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_recover_via\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_host\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_reply_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_cause\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_term_status\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_display\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_to_port\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.sip_user_agent\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_context\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_name\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.user_scheme\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_read_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.video_write_rate\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.w_domain\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_call_uuid\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"variables.webitel_data\",\"type\":\"string\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"waitsec\",\"type\":\"number\",\"count\":0,\"scripted\":false,\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true}]"
      }
    }
  }
];
