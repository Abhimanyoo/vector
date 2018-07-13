/**!
 *
 *  Copyright 2018 Andreas Gerstmayr.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

(function () {
  'use strict';

  /**
   * @name BccBiotopMetricDataModel
   * @desc
   */
  function BccBiotopMetricDataModel(WidgetDataModel, MetricListService, DashboardService, TableDataModel) {
    var DataModel = function () {
      return this;
    };

    DataModel.prototype = Object.create(WidgetDataModel.prototype);

    DataModel.prototype.init = function () {
      WidgetDataModel.prototype.init.call(this);

      this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + DashboardService.getGuid();

      function bytes_to_kb(x) {
        return (x / 1024).toFixed();
      }

      function us_to_ms(x) {
        return (x / 1000).toFixed(2);
      }

      this.tableDefinition = {
        columns: [
          {label: 'PID', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.pid')},
          {label: 'COMM', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.comm')},
          {label: 'D', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.direction')},
          {label: 'MAJ', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.major')},
          {label: 'MIN', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.minor')},
          {label: 'DISK', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.disk')},
          {label: 'I/O', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.io')},
          {label: 'Kbytes', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.bytes'), format: bytes_to_kb},
          {label: 'AVGms', metric: MetricListService.getOrCreateMetric('bcc.proc.io.perdev.duration'), format: us_to_ms}
        ],
        isMultiMetricsTable: true
      };

      // create derived metric
      this.metric = MetricListService.getOrCreateDerivedMetric(this.name, TableDataModel.derivedFunction.bind(null, this.tableDefinition));

      this.updateScope(this.metric.data);
    };

    DataModel.prototype.destroy = function () {
      // remove subscribers and delete derived metric
      MetricListService.destroyDerivedMetric(this.name);

      // remove subscribers and delete base metrics
      for (var i = 0; i < this.tableDefinition.columns.length; i++) {
        MetricListService.destroyMetric(this.tableDefinition.columns[i].metric.name);
      }

      WidgetDataModel.prototype.destroy.call(this);
    };

    return DataModel;
  }

  angular
    .module('datamodel')
    .factory('BccBiotopMetricDataModel', BccBiotopMetricDataModel);
})();
