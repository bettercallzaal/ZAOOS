'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiRoomProps {
  roomName: string;
  displayName: string;
  audioOnly?: boolean;
  onClose?: () => void;
}

export function JitsiRoom({ roomName, displayName, audioOnly = true, onClose }: JitsiRoomProps) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: audioOnly,
          startAudioOnly: audioOnly,
          prejoinConfig: { enabled: false },
          disableDeepLinking: true,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'chat', 'raisehand',
            'participants-pane', 'hangup', 'tileview',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        }}
        userInfo={{ displayName, email: '' }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = 'none';
        }}
        onReadyToClose={() => onClose?.()}
      />
    </div>
  );
}
