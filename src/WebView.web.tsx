import invariant from 'invariant';
import React, { SyntheticEvent, DetailedHTMLProps, IframeHTMLAttributes } from 'react';
import { View as RNView, StyleSheet as RNStyleSheet } from 'react-native';
// @ts-ignore
// eslint-disable-next-line camelcase
import { createElement, View as RNWView, StyleSheet as RNWStyleSheet } from 'react-native-web';
import { defaultRenderLoading } from './WebViewShared';
import styles from './WebView.styles';
import {State, WebWebViewProps} from './WebViewTypes';

// Fix type of imports from react-native-web.
const View = RNWView as typeof RNView;
const StyleSheet = RNWStyleSheet as typeof RNStyleSheet;

class WebView extends React.Component<WebWebViewProps, State> {
  state: State = {
    viewState: this.props.startInLoadingState ? 'LOADING' : 'IDLE',
    // eslint-disable-next-line react/no-unused-state
    lastErrorEvent: null
  }

  private webViewRef = React.createRef<HTMLIFrameElement>();

  private ownerWindow: Window | null = null;

  componentDidMount() {
    const {ownerDocument} = this.getIframe();
    this.ownerWindow = ownerDocument && ownerDocument.defaultView;

    invariant(this.ownerWindow !== null, 'ownerWindow expected to be non-null');

    (this.ownerWindow as Window).addEventListener('message', this.onMessage);
  }

  componentWillUnmount() {
    if (this.ownerWindow)
      this.ownerWindow.removeEventListener('message', this.onMessage);
  }

  private onMessage(event: MessageEvent) {
    const {onMessage} = this.props;
    const url = this.getSourceUrl();

    if (!onMessage || !url || event.origin !== url.origin)
      return;

    onMessage(event);
  }

  private getIframe() {
    const iframe = this.webViewRef.current;
    invariant(iframe !== null, 'webViewRef.current expected to be non-null');
    
    return iframe as HTMLIFrameElement;
  }

  private getIframeUrl() {
    const url = this.getSourceUrl();

    return url ? url.href : 'about:blank';
  }

  private getSourceUrl() {
    const {source} = this.props;

    if (source && 'uri' in source)
      return new URL(source.uri);

    return null;
  }

  goBack = () => {
    throw new Error('Not implemented');
  };

  goForward = () => {
    throw new Error('Not implemented');
  };

  reload = () => {
    throw new Error('Not implemented');
  };

  stopLoading = () => {
    throw new Error('Not implemented');
  };

  extraNativeComponentConfig = () => {
    throw new Error('Not implemented');
  };

  injectJavascript = () => {
    throw new Error('Not implemented');
  };

  onLoad = (event: SyntheticEvent<HTMLIFrameElement, Event>) => {
    const {onLoad} = this.props;

    if (onLoad)
      onLoad(event);

    this.setState({viewState: 'IDLE'});
  };

  /**
   * Request focus on WebView rendered page.
   */
  requestFocus = () => {
    this.getIframe().focus();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(message: any, targetOrigin: string, transer?: Transferable[]) {
    const iframeWindow = this.getIframe().contentWindow;
    invariant(iframeWindow !== null, 'iframeWindow expected to be non-null');

    (iframeWindow as Window).postMessage(message, targetOrigin, transer);
  }

  private renderOtherView() {
    const {renderLoading} = this.props;
    const {viewState} = this.state;
    
    switch (viewState) {
      case 'IDLE':
        return null;

      case 'LOADING':
        return (renderLoading || defaultRenderLoading)();
    
      case 'ERROR':
        // WebView for Web doesn't support being in an error state.
        return null;

      default:
        console.error(`RNCWebView invalid state encountered: ${viewState}`);
        return null;
    }
  }

  render() {
    const {containerStyle, nativeConfig = {}, style} = this.props;

    const webViewStyles = [styles.container, styles.webView, style];
    const webViewContainerStyle = [styles.container, containerStyle];

    const styleObj = StyleSheet.flatten(style);

    const iframeProps: DetailedHTMLProps<IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement> = {
      ref: this.webViewRef,
      width: styleObj && styleObj.width,
      height: styleObj && styleObj.height,
      onLoad: this.onLoad,
      src: this.getIframeUrl()
    };

    const webview = createElement('iframe', {
      ...iframeProps,
      ...nativeConfig.props,
      style: webViewStyles
    });

    return (
      <View style={webViewContainerStyle}>
        {webview}
        {this.renderOtherView()}
      </View>
    );
  }
}

export default WebView;