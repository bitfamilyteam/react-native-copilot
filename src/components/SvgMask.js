// @flow
import React, { Component } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
import Svg from 'react-native-svg';
import AnimatedSvgPath from './AnimatedPath';

import type { valueXY, svgMaskPath } from '../types';

const windowDimensions = Dimensions.get('window');

const getRadius = ({
  xSize, ySize, borderRadius, isCircle,
}) => {
  if (isCircle) {
    return xSize / 2;
  }
  return borderRadius * 2 > ySize ? ySize / 2 : borderRadius;
};

const circle = r => `a${r} ${r} 0 0 0 ${2 * r} 0a${r} ${r} 0 0 0 ${-2 * r} 0`;

const getArcByQuarters = (x, y, radius) =>
  `a${radius} ${radius} 0 0 1 ${x * radius} ${y * radius}`;
const getCorners = r => ({
  leftTop: getArcByQuarters(1, -1, r),
  rightTop: getArcByQuarters(1, 1, r),
  rightBottom: getArcByQuarters(-1, 1, r),
  leftBottom: getArcByQuarters(-1, -1, r),
});

const defaultSvgPath = ({
  size,
  position,
  canvasSize,
  isCircle,
  borderRadius,
}): string => {
  const background = `M0,0H${canvasSize.x}V${canvasSize.y}H0V0Z`;
  const {
    x: { _value: xPos },
    y: { _value: yPos },
  } = position;

  const {
    x: { _value: xSize },
    y: { _value: ySize },
  } = size;

  const radius = getRadius({
    xSize, ySize, borderRadius, isCircle,
  });

  const corners = getCorners(radius);

  const elementMask = isCircle
    ? circle(radius)
    : `${corners.leftTop}h${xSize - 2 * radius}${corners.rightTop}` +
      `v${ySize - 2 * radius}${corners.rightBottom}h${-xSize + 2 * radius}` +
      `${corners.leftBottom}`;
  return `${background}M${xPos},${yPos + radius}${elementMask}Z`;
};

type Props = {
  size: valueXY,
  position: valueXY,
  style: object | number | Array,
  easing: func,
  animationDuration: number,
  animated: boolean,
  backdropColor: string,
  svgMaskPath?: svgMaskPath,
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
    svgMaskPath: defaultSvgPath,
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

  componentDidUpdate({ position: prevPosition, size: prevSize }) {
    const { position, size } = this.props;
    if (position !== prevPosition || size !== prevSize) {
      this.animate(size, position);
    }
  }

  animationListener = (): void => {
    const d: string = this.props.svgMaskPath({
      size: this.state.size,
      position: this.state.position,
      canvasSize: this.state.canvasSize,
      isCircle: this.props.isCircle,
      borderRadius: this.props.borderRadius,
    });
    if (this.mask) {
      this.mask.setNativeProps({ d });
    }
  };

  animate = (
    size: valueXY = this.props.size,
    position: valueXY = this.props.position,
  ): void => {
    if (this.props.animated) {
      Animated.parallel([
        Animated.timing(this.state.size, {
          toValue: size,
          duration: this.props.animationDuration,
          easing: this.props.easing,
          useNativeDriver: false,
        }),
        Animated.timing(this.state.position, {
          toValue: position,
          duration: this.props.animationDuration,
          easing: this.props.easing,
          useNativeDriver: false,
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
      <View
        pointerEvents="box-none"
        style={this.props.style}
        onLayout={this.handleLayout}
      >
        {this.state.canvasSize ? (
          <Svg
            pointerEvents="none"
            width={this.state.canvasSize.x}
            height={this.state.canvasSize.y}
          >
            <AnimatedSvgPath
              ref={(ref) => {
                this.mask = ref;
              }}
              fill={this.props.backdropColor}
              fillRule="evenodd"
              strokeWidth={1}
              d={this.props.svgMaskPath({
                size: this.state.size,
                position: this.state.position,
                canvasSize: this.state.canvasSize,
                isCircle: this.props.isCircle,
                borderRadius: this.props.borderRadius,
              })}
            />
          </Svg>
        ) : null}
      </View>
    );
  }
}

export default SvgMask;
