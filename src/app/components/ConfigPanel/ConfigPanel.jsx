import React from 'react'
import PropTypes from 'prop-types'

import { Segment  } from 'semantic-ui-react'
import ChartSelector from './ChartSelector.jsx'
import ContextMenu from './ContextMenu.jsx'
import { matchesTarget, isContextLoading } from '../../utils'

const panelStyle = {
  marginTop: '0px',
}

function getSelectedContextPmids(contextDatas, selected) {
  if (!selected) return undefined

  const context = contextDatas.find(cd => matchesTarget(cd.target, selected.target))
  return context && context.pmids
}

class ConfigPanel extends React.PureComponent {
  state = {}

  handleClearCharts = () => {
    if (this.state.selectedContext) {
      this.props.onClearChartsFromContext(this.state.selectedContext)
    }
  }

  handleAddChart = (chart) => {
    if (this.state.selectedContext) {
      this.props.onAddChartToContext(this.state.selectedContext, chart)
    }
  }

  handleContextSelect = (context) => {
    this.setState({ selectedContext: context })
  }

  handleNewContext = (context) => {
    this.props.onNewContext(context)
    if (this.state.selectedContext === null) {
      this.setState({ selectedContext: context })
    }
  }

  handleRemoveContext = (context) => {
    this.props.onRemoveContext(context)
    if (matchesTarget(this.state.selectedContext.target, context.target)) {
      this.setState({ selectedContext: null })
    }
  }

  componentDidUpdate = () => {
    let validContexts = this.props.contextData.filter(cd => !isContextLoading(cd))

    // it is valid if we have a selection, and there is some context that matches our selection
    let validSelection = this.state.selectedContext &&
      validContexts.some(cd => matchesTarget(cd.target, this.state.selectedContext.target))

    // early exit
    if (validSelection) return

    // if there is an available context to use, connect
    if (validContexts.length > 0) {
      this.setState({ selectedContext: validContexts[0] })
    }

    // if not, then clear out our state
    if (this.state.selectedContext && validContexts.length === 0) {
      this.setState({ selectedContext: null })
    }
  }

  render () {
    return (
      <Segment.Group horizontal compact style={panelStyle}>
        <ContextMenu
          config={this.props.config}
          contextData={this.props.contextData}
          selectedContext={this.state.selectedContext}
          onContextSelect={this.handleContextSelect}
          onNewContext={this.handleNewContext}
          initialAddContext={this.props.initialAddContext}
          onRemoveContext={this.handleRemoveContext} />

        <ChartSelector
          disabled={!this.state.selectedContext}
          charts={this.props.charts}
          bundles={this.props.bundles}
          onClearCharts={this.handleClearCharts}
          onAddChart={this.handleAddChart}
          onRequestClose={this.props.onRequestClose}
          selectedPmids={getSelectedContextPmids(
            this.props.contextData, this.state.selectedContext)} />

      </Segment.Group>
    )
  }
}

ConfigPanel.propTypes = {
  config: PropTypes.shape({
    defaultPort: PropTypes.number.isRequired,
    defaultHostspec: PropTypes.string.isRequired,
    dataWindows: PropTypes.arrayOf(
      PropTypes.shape({
        valueSeconds: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
      })
    ),
    pollIntervals: PropTypes.arrayOf(
      PropTypes.shape({
        valueSeconds: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
      })
    ),
    disableHostspecInput: PropTypes.bool.isRequired,
    disableContainerSelect: PropTypes.bool.isRequired,
  }),
  contextData: PropTypes.array.isRequired,
  onNewContext: PropTypes.func.isRequired,
  onAddChartToContext: PropTypes.func.isRequired,
  onClearChartsFromContext: PropTypes.func.isRequired,
  onRemoveContext: PropTypes.func.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  charts: PropTypes.array.isRequired,
  bundles: PropTypes.array.isRequired,
  initialAddContext: PropTypes.bool.isRequired,
}

ConfigPanel.getSelectedContextPmids = getSelectedContextPmids

export default ConfigPanel
