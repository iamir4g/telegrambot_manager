import { ActionIcon, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMoodSmile } from '@tabler/icons-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import type { Editor } from '@tiptap/react';

type EmojiSelectPayload = {
  native: string;
};

type Props = {
  editor: Editor | null;
};

export function EmojiToolbarButton({ editor }: Props) {
  const [opened, { close, toggle }] = useDisclosure(false);

  return (
    <Popover
      opened={opened}
      onChange={(v) => (v ? toggle() : close())}
      position="bottom-start"
      shadow="md"
      withinPortal
      trapFocus={false}
    >
      <Popover.Target>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="افزودن ایموجی"
          disabled={!editor}
          onClick={toggle}
        >
          <IconMoodSmile size={18} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p={0} style={{ border: 'none', background: 'transparent' }}>
        <div dir="ltr">
          <Picker
            data={data}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            perLine={8}
            maxFrequentRows={1}
            onEmojiSelect={(emoji: EmojiSelectPayload) => {
              if (!editor || !emoji.native) return;
              editor.chain().focus().insertContent(emoji.native).run();
              close();
            }}
          />
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
