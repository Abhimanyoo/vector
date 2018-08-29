// TODO plenty more tests
// TODO toast messages when there are issues
// TODO lots of stuff in the config.js is ignored, clean it up
// TODO add flame graphs (maybe not?)
// TODO enable vector to browse and collect cluster and container information from external sources
// - needs to be pluggable, eg from k8s/titus/etc

import React from 'react'
import PropTypes from 'prop-types'

/*
import process from 'process'
import { whyDidYouUpdate } from 'why-did-you-update'
if (process.env.NODE_ENV !== 'production') {
  whyDidYouUpdate(React)
}
*/

import { render } from 'react-dom'

import config from './config'

import Navbar from './components/Navbar/Navbar.jsx'
import Footer from './components/Footer/Footer.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import ConfigPanel from './components/ConfigPanel/ConfigPanel.jsx'
import ContextPoller from './components/Pollers/ContextPoller.jsx'
import DatasetPoller from './components/Pollers/DatasetPoller.jsx'

import { Sidebar } from 'semantic-ui-react'
import isEqual from 'lodash.isequal'

import 'semantic-ui-css/semantic.min.css'
import { matchesTarget, getChartsFromQueryString, pushQueryStringToHistory } from './utils'

import { BrowserRouter, Switch, Route } from 'react-router-dom'
import charts from './charts'

const initialChartIdlist = getChartsFromQueryString(location.search)
const initialTargets = initialChartIdlist.targets
const initialChartlist = initialChartIdlist.chartlist
  .map(c => ({
    context: { target: c.target },
    ...charts.find(ch => c.chartId === ch.chartId)
  }))

class App extends React.Component {
  state = {
    chartlist: this.props.initialChartlist,
    pollIntervalMs: 2000,
    windowIntervalMs: 120000,
    contextData: [],
    contextDatasets: [],
    targets: this.props.initialTargets,
    configVisible: false,
  }

  refreshQueryString = () => {
    pushQueryStringToHistory(this.state.targets, this.state.chartlist, this.props.history)
  }

  // chart handling
  onClearChartsFromContext = (ctx) => {
    this.setState((oldState) => ({
      chartlist: oldState.chartlist.filter(chart =>
        !(matchesTarget(chart.context.target, ctx.target)))
    }), this.refreshQueryString)
  }
  onAddChartToContext = (ctx, chart) => {
    this.setState((oldState) => ({ chartlist: oldState.chartlist.concat({ ...chart, context: ctx }) }), this.refreshQueryString)
  }
  removeChartByIndex = (idx) => {
    this.setState(oldState =>
      ({ chartlist: [ ...oldState.chartlist.slice(0, idx), ...oldState.chartlist.slice(idx + 1) ] }), this.refreshQueryString)
  }
  updateChartSettings = (idx, settings) => {
    this.setState((oldState) => {
      let newChart = { ...oldState.chartlist[idx], ...settings }
      return { chartlist: [ ...oldState.chartlist.slice(0, idx), newChart, ...oldState.chartlist.slice(idx + 1) ] }
    })
  }

  // context handling
  onContextsUpdated = (contexts) => {
    this.setState(state => {
      if (isEqual(contexts, state.contextData)) return undefined

      // update any charts with the refreshed context from the chart list
      let newChartlist = this.state.chartlist.map(c => ({
        ...c,
        context: contexts.find(ctx => matchesTarget(ctx.target, c.context.target))
      }))
      return {
        chartlist: newChartlist,
        contextData: [ ...contexts ],
      }
    })
  }

  onContextDatasetsUpdated = (ctxds) => {
    this.setState({ contextDatasets: ctxds })
  }

  onNewContext = (target) => this.setState((state) => ({ targets: state.targets.concat(target) }), this.refreshQueryString)
  onRemoveContext = (context) => this.setState((state) => ({
    // remove all targets, and remove all charts
    targets: state.targets.filter(target =>
      !(matchesTarget(target, context.target))),
    chartlist: state.chartlist.filter(chart =>
      !(matchesTarget(chart.context.target, context.target))),
  }), this.refreshQueryString)

  // config panel visibility
  toggleConfigVisible = () => this.setState((state) => ({ configVisible: !state.configVisible }))
  handleSidebarHide = () => this.setState({ configVisible: false })

  // app config settings
  onWindowSecondsChange = (sec) => this.setState({ windowIntervalMs: sec * 1000 })
  onPollIntervalSecondsChange = (sec) => this.setState({ pollIntervalMs: sec * 1000 })

  render () {
    return (
      <div>
        <div className="col-md-12">
          <Navbar embed={this.props.embed} onClick={this.toggleConfigVisible} />

          <ContextPoller
            pollIntervalMs={5000}
            targets={this.state.targets}
            onContextsUpdated={this.onContextsUpdated} />

          <DatasetPoller
            pollIntervalMs={this.state.pollIntervalMs}
            charts={this.state.chartlist}
            windowIntervalMs={this.state.windowIntervalMs}
            contextData={this.state.contextData}
            onContextDatasetsUpdated={this.onContextDatasetsUpdated} />

          <Sidebar.Pushable style={{ minHeight: '100vh' }}>
            <Sidebar
              animation='overlay'
              direction='top'
              visible={
                !this.props.embed
                && (this.state.chartlist.length === 0 || this.state.configVisible ? true : undefined)}
              onHide={this.handleSidebarHide} >

              <ConfigPanel
                charts={charts}
                contextData={this.state.contextData}
                onNewContext={this.onNewContext}
                onRemoveContext={this.onRemoveContext}
                onAddChartToContext={this.onAddChartToContext}
                onClearChartsFromContext={this.onClearChartsFromContext}
                onWindowSecondsChange={this.onWindowSecondsChange}
                onPollIntervalSecondsChange={this.onPollIntervalSecondsChange} />
            </Sidebar>

            <Sidebar.Pusher>

              <Dashboard
                chartlist={this.state.chartlist}
                contextDatasets={this.state.contextDatasets}
                removeChartByIndex={this.removeChartByIndex}
                updateChartSettings={this.updateChartSettings}
                onMoveChart={this.onMoveChart} />

              <Footer version={config.version}/>

            </Sidebar.Pusher>

          </Sidebar.Pushable>
        </div>
      </div>
    )
  }
}

App.propTypes = {
  embed: PropTypes.bool.isRequired,
  initialTargets: PropTypes.array.isRequired,
  initialChartlist: PropTypes.array.isRequired,
  history: PropTypes.object.isRequired,
}

class PageRouter extends React.Component {
  AppEmbed = (props) =>
    <App embed={true}
      initialTargets={initialTargets}
      initialChartlist={initialChartlist}
      history={props.history} />

  AppNormal = (props) =>
    <App embed={false}
      initialTargets={initialTargets}
      initialChartlist={initialChartlist}
      history={props.history} />

  render () {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/embed" render={this.AppEmbed}/>
          <Route path="/" render={this.AppNormal}/>
        </Switch>
      </BrowserRouter>
    )
  }
}

PageRouter.propTypes = {
}

render(<PageRouter/>, document.getElementById('app'))
