import { useRecoilState, useRecoilValue } from 'recoil';
import { Skeleton, Row, Button, Spin } from 'antd';
import MessageFilled from '@ant-design/icons/MessageFilled';
import { FC, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import classnames from 'classnames';
import { LOCAL_STORAGE_KEYS, getLocalStorage, setLocalStorage } from '../../../utils/localStorage';
import { canPushNotificationsBeSupported } from '../../../utils/browserPushNotifications';

import {
  clientConfigStateAtom,
  currentUserAtom,
  ChatState,
  chatStateAtom,
  appStateAtom,
  isOnlineSelector,
  isMobileAtom,
  serverStatusState,
  isChatAvailableSelector,
  visibleChatMessagesSelector,
} from '../../stores/ClientConfigStore';
import { ClientConfig } from '../../../interfaces/client-config.model';

import styles from './Content.module.scss';
import { OfflineBanner } from '../OfflineBanner/OfflineBanner';
import { AppStateOptions } from '../../stores/application-state';
import { ServerStatus } from '../../../interfaces/server-status.model';
import { Statusbar } from '../Statusbar/Statusbar';
import { ChatMessage } from '../../../interfaces/chat-message.model';
import { ExternalAction } from '../../../interfaces/external-action';
import { Modal } from '../Modal/Modal';
import { ChatModal } from '../../modals/ChatModal/ChatModal';

// Lazy loaded components
const ChatContainer = dynamic(
  () => import('../../chat/ChatContainer/ChatContainer').then(mod => mod.ChatContainer),
  {
    ssr: false,
  },
);

const FollowModal = dynamic(
  () => import('../../modals/FollowModal/FollowModal').then(mod => mod.FollowModal),
  {
    ssr: false,
    loading: () => <Skeleton loading active paragraph={{ rows: 8 }} />,
  },
);

const OwncastPlayer = dynamic(
  () => import('../../video/OwncastPlayer/OwncastPlayer').then(mod => mod.OwncastPlayer),
  {
    ssr: false,
    loading: () => <Skeleton loading active paragraph={{ rows: 12 }} />,
  },
);

const ExternalModal = ({ externalActionToDisplay, setExternalActionToDisplay }) => {
  const { title, description, url, html } = externalActionToDisplay;
  return (
    <Modal
      title={description || title}
      url={url}
      open={!!externalActionToDisplay}
      height="80vh"
      handleCancel={() => setExternalActionToDisplay(null)}
    >
      {html ? (
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            height: '100%',
            width: '100%',
            overflow: 'auto',
          }}
        />
      ) : null}
    </Modal>
  );
};

export const Content: FC = () => {
  const appState = useRecoilValue<AppStateOptions>(appStateAtom);
  const clientConfig = useRecoilValue<ClientConfig>(clientConfigStateAtom);
  const chatState = useRecoilValue<ChatState>(chatStateAtom);
  const currentUser = useRecoilValue(currentUserAtom);
  const serverStatus = useRecoilValue<ServerStatus>(serverStatusState);
  const [isMobile, setIsMobile] = useRecoilState<boolean | undefined>(isMobileAtom);
  const messages = useRecoilValue<ChatMessage[]>(visibleChatMessagesSelector);
  const online = useRecoilValue<boolean>(isOnlineSelector);
  const isChatAvailable = useRecoilValue<boolean>(isChatAvailableSelector);

  const { viewerCount, lastConnectTime, lastDisconnectTime, streamTitle } =
    useRecoilValue<ServerStatus>(serverStatusState);
  const { name, offlineMessage, chatDisabled, federation, notifications } = clientConfig;
  const [showFollowModal, setShowFollowModal] = useState(false);
  const { account: fediverseAccount } = federation;
  const { browser: browserNotifications } = notifications;
  const { enabled: browserNotificationsEnabled } = browserNotifications;
  const { online: isStreamLive } = serverStatus;
  const [externalActionToDisplay, setExternalActionToDisplay] = useState<ExternalAction>(null);

  const [supportsBrowserNotifications, setSupportsBrowserNotifications] = useState(false);

  const [showChatModal, setShowChatModal] = useState(false);

  const incrementVisitCounter = () => {
    let visits = parseInt(getLocalStorage(LOCAL_STORAGE_KEYS.userVisitCount), 10);
    if (Number.isNaN(visits)) {
      visits = 0;
    }
    setLocalStorage(LOCAL_STORAGE_KEYS.userVisitCount, visits + 1);
  };

  const checkIfMobile = () => {
    const w = window.innerWidth;
    if (isMobile === undefined) {
      if (w <= 768) setIsMobile(true);
      else setIsMobile(false);
    }
    if (!isMobile && w <= 768) setIsMobile(true);
    if (isMobile && w > 768) setIsMobile(false);
  };

  useEffect(() => {
    incrementVisitCounter();
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    // isPushNotificationSupported relies on `navigator` so that needs to be
    // fired from this useEffect.
    setSupportsBrowserNotifications(
      canPushNotificationsBeSupported() && browserNotificationsEnabled,
    );
  }, [browserNotificationsEnabled]);

  const showChat = isChatAvailable && !chatDisabled && chatState === ChatState.VISIBLE;

  return (
    <div className={styles.main}>
      <div className={styles.mainColumn}>
        {appState.appLoading && (
          <div
            className={classnames([styles.topSectionElement, styles.centerSpinner])}
            style={{ height: '30vh' }}
          >
            <Spin delay={2} size="large" tip="One moment..." />
          </div>
        )}
        <Row>
          {online && (
            <OwncastPlayer
              source="/hls/stream.m3u8"
              online={online}
              title={streamTitle || name}
              className={styles.topSectionElement}
            />
          )}
          {!online && !appState.appLoading && (
            <div id="offline-message" style={{ width: '100%' }}>
              <OfflineBanner
                showsHeader={false}
                streamName={name}
                customText={offlineMessage}
                notificationsEnabled={supportsBrowserNotifications}
                fediverseAccount={fediverseAccount}
                lastLive={lastDisconnectTime}
                onFollowClick={() => setShowFollowModal(true)}
                className={classnames([styles.topSectionElement, styles.offlineBanner])}
              />
            </div>
          )}
        </Row>
        <Row>
          {isStreamLive && (
            <Statusbar
              online={online}
              lastConnectTime={lastConnectTime}
              lastDisconnectTime={lastDisconnectTime}
              viewerCount={viewerCount}
              className={classnames(styles.topSectionElement, styles.statusBar)}
            />
          )}
        </Row>
        <div style={{ flex: '1 1' }} />
      </div>
      {showChat && !isMobile && currentUser && (
        <ChatContainer
          messages={messages}
          usernameToHighlight={currentUser.displayName}
          chatUserId={currentUser.id}
          isModerator={currentUser.isModerator}
          chatAvailable={isChatAvailable}
          showInput={!!currentUser}
          desktop
        />
      )}
      {externalActionToDisplay && (
        <ExternalModal
          externalActionToDisplay={externalActionToDisplay}
          setExternalActionToDisplay={setExternalActionToDisplay}
        />
      )}
      <Modal
        title={`Follow ${name}`}
        open={showFollowModal}
        handleCancel={() => setShowFollowModal(false)}
        width="550px"
      >
        <FollowModal
          account={fediverseAccount}
          name={name}
          handleClose={() => setShowFollowModal(false)}
        />
      </Modal>
      {isMobile && showChatModal && chatState === ChatState.VISIBLE && (
        <ChatModal
          messages={messages}
          currentUser={currentUser}
          handleClose={() => setShowChatModal(false)}
        />
      )}
      {isMobile && isChatAvailable && !chatDisabled && (
        <Button
          id="mobile-chat-button"
          type="primary"
          onClick={() => setShowChatModal(true)}
          className={styles.floatingMobileChatModalButton}
        >
          Chat <MessageFilled />
        </Button>
      )}
    </div>
  );
};
