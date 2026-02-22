// src/mocks/maps.stub.js — react-native-maps web stub
const React = require('react');
const { View } = require('react-native');
const noop = () => null;
const MapView = (props) => React.createElement(View, props);
MapView.Animated = MapView;
module.exports = {
    default: MapView, MapView,
    Marker: noop, Polyline: noop, Polygon: noop,
    Circle: noop, Callout: noop, Overlay: noop,
    PROVIDER_GOOGLE: 'google', PROVIDER_DEFAULT: null,
};
