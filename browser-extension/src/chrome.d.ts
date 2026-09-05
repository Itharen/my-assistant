declare namespace chrome {
  namespace runtime {
    interface MessageSender { url?: string; tab?: tabs.Tab }
    const onMessage: {
      addListener(callback: (
        message: unknown,
        sender: MessageSender,
        sendResponse: (response: unknown) => void,
      ) => boolean | void): void;
    };
    function sendMessage<T>(message: unknown): Promise<T>;
  }
  namespace tabs {
    interface Tab { id?: number; windowId?: number; url?: string }
    function create(set: { url: string; active: boolean; windowId?: number }): Promise<Tab>;
  }
  namespace sidePanel {
    function open(set: { windowId: number }): Promise<void>;
  }
  namespace action {
    const onClicked: { addListener(callback: (tab: tabs.Tab) => void): void };
  }
}
