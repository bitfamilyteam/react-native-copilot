// @flow
import React, { Component } from 'react';
import { View, Animated, Easing, Dimensions } from 'react-native';
// import { Svg } from 'expo';
import Svg from 'react-native-svg';
import AnimatedSvgPath from './AnimatedPath';

import type { valueXY } from '../types';

const windowDimensions = Dimensions.get('window');

const circle = r => `a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

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
    let {
      x: { _value: xPos },
      y: { _value: yPos },
    } = position;

    let {
      x: { _value: xSize },
      y: { _value: ySize },
    } = size;
    const { isCircle, borderRadius } = this.props;
    if (isCircle) {
      xPos += 2;
      yPos += 2;
      ySize -= 4;
      xSize -= 4;
    }

    const radius = isCircle ? xSize / 2 : borderRadius;

    const getArcByQuarters = (x, y) => `a${radius} ${radius} 0 0 1 ${x * radius} ${y * radius}`;
    const corners = {
      leftTop: getArcByQuarters(1, -1),
      rightTop: getArcByQuarters(1, 1),
      rightBottom: getArcByQuarters(-1, 1),
      leftBottom: getArcByQuarters(-1, -1),
    };

    const elementMask = isCircle
      ? circle(radius)
      : `${corners.leftTop}h${xSize - 2 * radius}${corners.rightTop}` +
        `v${ySize - 2 * radius}${corners.rightBottom}h${-xSize + 2 * radius}` +
        `${corners.leftBottom}`;
    return `${background}M${xPos},${yPos + radius}${elementMask}Z`;
  };

  animationListener = (): void => {
    const d: string = this.path(this.state.size, this.state.position, this.state.canvasSize);
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
