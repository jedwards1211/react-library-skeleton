/* @flow */

import React from 'react'
import defaults from 'lodash.defaults'
import type {Feature, Features} from 'redux-features'
import {connect} from 'react-redux'
import {createStructuredSelector, createSelector} from 'reselect'

type Components<P: Object> = React.Element<P>
  | ReactClass<P>
  | Array<React.Element<P> | ReactClass<P>>

type Options<S, A, P: Object> = {
  getFeatures?: (state: S) => Features<S, A>,
  sortFeatures?: (features: Features<S, A>) => Array<Feature<S, A>>,
  getComponents: (feature: Feature<S, A>) => Components<P>,
}

export default function featureComponents<S, A, P: Object>(
  options: Options<S, A, P>,
): ReactClass<P> {
  const {getFeatures, sortFeatures, getComponents} = defaults({}, options, {
    getFeatures: state => state ? state.features : {},
    sortFeatures: features => Object.values(features),
  })

  type PropsFromState = {
    features: Array<Feature<S, A>>,
  }

  const mapStateToProps: (state: S) => PropsFromState = createStructuredSelector({
    features: createSelector(
      getFeatures,
      sortFeatures,
    ),
  })

  function mergeProps({features}: PropsFromState, dispatchProps: any, {children, ...props}: P): {children: any} {
    const renderedComponents = []
    features.forEach((feature: Feature<S, A>, featureIndex: number) => {
      let components = getComponents(feature)
      if (components == null) return
      if (!Array.isArray(components)) components = [components]
      components.forEach((Comp: React.Element<P> | ReactClass<P>, index: number) => {
        const key = featureIndex + ':' + index
        if (React.isValidElement(Comp)) renderedComponents.push(React.cloneElement((Comp: any), {...props, key}))
        else if (typeof Comp === 'function') renderedComponents.push(<Comp {...props} key={key} />)
      })
    })
    return {
      children: children instanceof Function
        ? children(renderedComponents)
        : <div>{renderedComponents}</div>,
    }
  }

  const FeatureComponents = ({children}) => children

  return connect(mapStateToProps, null, mergeProps)(FeatureComponents)
}
