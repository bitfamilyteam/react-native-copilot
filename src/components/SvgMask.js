// @flow
import React, { Component } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
// import { Svg } from 'expo';
import Svg from 'react-native-svg';
import AnimatedSvgPath from './AnimatedPath';

import type { valueXY } from '../types';

const windowDimensions = Dimensions.get('window');

type Props = {
  size: valueXY,
  position: valueXY,
  style: object | number | Array,
  easing: func,
  animationDuration: number,
  animated: boolean,
  backdropColor: string,
  borderRadius: number,
  isCircle: boolean,
};

type State = {
  size: Animated.ValueXY,
  position: Animated.ValueXY,
  canvasSize: ?valueXY,
};

class SvgMask extends Component<Props, State> {
  static defaultProps = {
    animationDuration: 300,
    easing: Easing.linear,
  };

  constructor(props) {
    super(props);

    this.state = {
      canvasSize: {
        x: windowDimensions.width,
        y: windowDimensions.height,
      },
      size: new Animated.ValueXY(props.size),
      position: new Animated.ValueXY(props.position),
    };

    this.state.position.addListener(this.animationListener);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.position !== nextProps.position || this.props.size !== nextProps.size) {
      this.animate(nextProps.size, nextProps.position);
    }
  }

  path = (size, position, canvasSize): string => {
    const background = `M0,0H${canvasSize.x}V${canvasSize.y}H0V0Z`;
    const {
      x: { _value: xPos },
      y: { _value: yPos },
    } = position;

    const {
      x: { _value: xSize },
      y: { _value: ySize },
    } = size;

    const radius = this.props.isCircle ? xSize / 2 : this.props.borderRadius;

    const radiusOffset = (4 / 3) * Math.tan(Math.PI / 8) * radius;

    const corners = {
      leftTop:
        'C' +
        `${xPos},${yPos + radius - radiusOffset} ` +
        `${xPos + radius - radiusOffset},${yPos} ` +
        `${xPos + radius},${yPos}`,
      rightTop:
        'C' +
        `${xPos + xSize - radiusOffset},${yPos} ` +
        `${xPos + xSize},${yPos + radius - radiusOffset} ` +
        `${xPos + xSize},${yPos + radius}`,
      rightBottom:
        'C' +
        `${xPos + xSize},${yPos + ySize - radius + radiusOffset} ` +
        `${xPos + xSize - radius + radiusOffset},${yPos + ySize} ` +
        `${xPos + xSize - radius},${yPos + ySize}`,
      leftBottom:
        'C' +
        `${xPos + radius - radiusOffset},${yPos + ySize} ` +
        `${xPos},${yPos + ySize - radius + radiusOffset} ` +
        `${xPos},${yPos + ySize - radius}`,
    };

    const elementMask =
      `M${xPos},${yPos + radius}${corners.leftTop}H${xPos + xSize - radius}${corners.rightTop}V${yPos +
        ySize -
        radius}${corners.rightBottom}H${xPos + radius}` + `${corners.leftBottom}Z`;
    return `${background}${elementMask}`;
  };

  animationListener = (): void => {
    const d: string = this.path(
      this.state.size,
      this.state.position,
      this.state.canvasSize,
    );
    if (this.mask) {
      this.mask.setNativeProps({ d });
    }
  };

  animate = (size: valueXY = this.props.size, position: valueXY = this.props.position): void => {
    if (this.props.animated) {
      Animated.parallel([
        Animated.timing(this.state.size, {
          toValue: size,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
        Animated.timing(this.state.position, {
          toValue: position,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
      ]).start();
    } else {
      this.state.size.setValue(size);
      this.state.position.setValue(position);
    }
  };

  handleLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }) => {
    this.setState({
      canvasSize: {
        x: width,
        y: height,
      },
    });
  };

  render() {
    return (
      <View pointerEvents="box-none" style={this.props.style} onLayout={this.handleLayout}>
        {this.state.canvasSize ? (
          <Svg pointerEvents="none" width={this.state.canvasSize.x} height={this.state.canvasSize.y}>
            <AnimatedSvgPath
              ref={ref => {
                this.mask = ref;
              }}
              fill={this.props.backdropColor}
              fillRule="evenodd"
              strokeWidth={1}
              d={this.path(this.state.size, this.state.position, this.state.canvasSize)}
            />
          </Svg>
        ) : null}
      </View>
    );
  }
}

export default SvgMask;
