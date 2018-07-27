import simpleModel from '../processors/simpleModel'
import {
  mapInstanceDomains,
  mapContainerNames,
  divideByOnlyMetric,
  timesliceCalculations,
  customTitleAndKeylabel,
  kbToGb,
  combineValuesByTitle,
  toPercentage,
  defaultTitleAndKeylabel,
  divideBy,
  cumulativeTransform,
  cumulativeTransformOnlyMetric,
  // log,
} from '../processors/transforms'

import {
  firstValueInObject,
  keyValueArrayToObject,
} from '../processors/utils'

export default [
  // TODO need to remove containers that do not actually exist
  {
    group: 'Container',
    title: 'Per-Container CPU Utilization',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.cpuacct.usage',
      ],
      transforms: [
        // TODO check for container filter in ConfigPanel
        mapInstanceDomains,
        mapContainerNames('cgroup.cpuacct.usage'),
        defaultTitleAndKeylabel,
        cumulativeTransform,
        divideBy(1000 * 1000 * 1000),
        toPercentage,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container Memory Usage (Mb)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.memory.usage',
      ],
      transforms: [
        // TODO check for container filter in ConfigPanel
        mapInstanceDomains,
        mapContainerNames('cgroup.memory.usage'),
        defaultTitleAndKeylabel,
        kbToGb,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Total Container Memory Usage (Mb)',
    processor: simpleModel,
    config: {
      lineType: 'stackedarea',
      metricNames: [
        'cgroup.memory.usage',
        'mem.util.used',
        'mem.util.free',
      ],
      transforms: [
        // make sure that all the cgroup memory uses the same metric and then add them together
        // this sums all the values across the cgroup (map + fix are so that the cgroup size is calculated only on containers)
        mapInstanceDomains,
        mapContainerNames('cgroup.memory.usage'),
        customTitleAndKeylabel(metric => metric),
        combineValuesByTitle((a, b) => a + b),
        divideByOnlyMetric(1024, 'mem.util.used'),
        divideByOnlyMetric(1024, 'mem.util.free'),
        divideByOnlyMetric(1024 * 1024, 'cgroup.memory.usage'),
        // extra transform for cgroup memory usage
        // apply some mathsy stuff, note this wipes title and keylabel
        timesliceCalculations({
          'host used': (values) => ({ '-1': values['mem.util.used']['-1'] - firstValueInObject(values['cgroup.memory.usage']) }),
          'free (unused)': (values) => ({ '-1': values['mem.util.free']['-1'] }),
          'container used': (values) => ({ '-1': firstValueInObject(values['cgroup.memory.usage']) }),
        }),
        // add back a title and keylabel
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container Memory Headroom (Mb)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.memory.usage', // bytes
        'cgroup.memory.limit', // bytes
        'mem.physmem', // kilobytes
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.memory.usage'),
        mapContainerNames('cgroup.memory.limit'),
        divideByOnlyMetric(1024, 'mem.physmem'),
        divideByOnlyMetric(1024*1024, 'cgroup.memory.usage'),
        divideByOnlyMetric(1024*1024, 'cgroup.memory.limit'),
        timesliceCalculations({
          // TODO this calculation is substantially different from the old vector calculation
          'headroom': (slice) => {
            let containerNames = Object.keys(slice['cgroup.memory.usage'] || {})
            let headrooms = containerNames.map(cname => ({
              key: cname,
              value: Math.min(slice['cgroup.memory.limit'][cname], slice['mem.physmem']['-1']) - slice['cgroup.memory.usage'][cname]
            }))
            return headrooms.reduce(keyValueArrayToObject, {})
          }
        }),
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Container Disk IOPS',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.blkio.all.io_serviced.read',
        'cgroup.blkio.all.io_serviced.write',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.blkio.all.io_serviced.read'),
        mapContainerNames('cgroup.blkio.all.io_serviced.write'),
        cumulativeTransform,
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Container Disk Throughput (Bytes)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.blkio.all.io_service_bytes.read',
        'cgroup.blkio.all.io_service_bytes.write',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.blkio.all.io_service_bytes.read'),
        mapContainerNames('cgroup.blkio.all.io_service_bytes.write'),
        cumulativeTransform,
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Container Disk IOPS (Throttled)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.blkio.all.throttle.io_serviced.read',
        'cgroup.blkio.all.throttle.io_serviced.write',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.blkio.all.throttle.io_serviced.read'),
        mapContainerNames('cgroup.blkio.all.throttle.io_serviced.write'),
        cumulativeTransform,
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Container Disk Throughput (Throttled) (Bytes)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.blkio.all.throttle.io_service_bytes.read',
        'cgroup.blkio.all.throttle.io_service_bytes.write',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.blkio.all.throttle.io_service_bytes.read'),
        mapContainerNames('cgroup.blkio.all.throttle.io_service_bytes.write'),
        cumulativeTransform,
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container CPU Scheduler',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.cpusched.shares',
        'cgroup.cpusched.periods',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.cpusched.shares'),
        mapContainerNames('cgroup.cpusched.periods'),
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container CPU Headroom',
    processor: simpleModel,
    config: {
      lineType: 'stackedarea',
      metricNames: [
        'cgroup.cpuacct.usage',
        'cgroup.cpusched.shares',
        'cgroup.cpusched.periods',
        'hinv.ncpu',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.cpusched.shares'),
        mapContainerNames('cgroup.cpusched.periods'),
        mapContainerNames('cgroup.cpuacct.usage'),
        cumulativeTransformOnlyMetric('cgroup.cpuacct.usage'),
        divideByOnlyMetric(1000 * 1000 * 1000, 'cgroup.cpuacct.usage'),
        timesliceCalculations({
          // TODO i really don't understand why this calculation is built like this,
          // surely it should be something like: headroom = limits - utilisation
          'usage': (slice) => slice['cgroup.cpuacct.usage'] || [],
          'limit': (slice) => {
            let containerNames = Object.keys(slice['cgroup.cpusched.periods'] || {})
            let limits = containerNames.map(cname => ({
              key: cname,
              value: slice['cgroup.cpusched.shares'][cname]
                ? (slice['cgroup.cpusched.shares'][cname] / slice['cgroup.cpusched.periods'][cname])
                : slice['hinv.ncpu']['-1']
            }))
            return limits.reduce(keyValueArrayToObject, {})
          }
        }),
        defaultTitleAndKeylabel,
        toPercentage,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container Throttled CPU',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.cpusched.throttled_time',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.cpusched.throttled_time'),
        cumulativeTransform,
        // TODO fix up titling
        defaultTitleAndKeylabel,
      ],
    },
  },

  {
    group: 'Container',
    title: 'Per-Container Memory Utilization (%)',
    processor: simpleModel,
    config: {
      metricNames: [
        'cgroup.memory.usage',
        'cgroup.memory.limit',
        'mem.physmem',
      ],
      transforms: [
        mapInstanceDomains,
        mapContainerNames('cgroup.memory.usage'),
        mapContainerNames('cgroup.memory.limit'),
        divideByOnlyMetric(1024, 'mem.physmem'),
        divideByOnlyMetric(1024 * 1024, 'cgroup.memory.usage'),
        divideByOnlyMetric(1024 * 1024, 'cgroup.memory.limit'),
        timesliceCalculations({
          'utilization': (slice) => {
            let containerNames = Object.keys(slice['cgroup.memory.usage'] || {})
            let utilizations = containerNames.map(cname => ({
              key: cname,
              value: (cname in slice['cgroup.memory.limit'])
                ? (slice['cgroup.memory.usage'][cname] / Math.min(slice['cgroup.memory.limit'][cname], slice['mem.physmem']['-1']))
                : (slice['cgroup.memory.usage'][cname] / slice['mem.physmem']['-1'])
            }))
            return utilizations.reduce(keyValueArrayToObject, {})
          }
        }),
        defaultTitleAndKeylabel,
        toPercentage,
      ],
    },
  },
]
