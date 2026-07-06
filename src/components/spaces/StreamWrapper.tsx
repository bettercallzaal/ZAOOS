'use client';

import {
  type Call,
  StreamCall,
  StreamVideo,
  type StreamVideoClient,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface StreamWrapperProps {
  client: StreamVideoClient;
  call: Call;
  children: React.ReactNode;
}

export function StreamWrapper({ client, call, children }: StreamWrapperProps) {
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>{children}</StreamCall>
    </StreamVideo>
  );
}
