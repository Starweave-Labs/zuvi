import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { wordAddBookmark, wordBookmarks, wordGoToBookmark, wordRemoveBookmark } from './studio-word-bookmarks';

export function StudioWordBookmarkDialog({ editor, otherEditors = [], onClose }: { editor: Editor; otherEditors?: Editor[]; onClose: () => void }) {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [composing, setComposing] = React.useState(false);
  const [snapshot, setSnapshot] = React.useState(() => ({ doc: editor.state.doc, selection: editor.state.selection }));
  const [, refresh] = React.useReducer(value => value + 1, 0);
  React.useEffect(() => {
    const update = () => refresh();
    editor.on('transaction', update); editor.on('update', update);
    return () => { editor.off('transaction', update); editor.off('update', update); };
  }, [editor]);
  let ranges: ReturnType<typeof wordBookmarks> = [];
  let rangeError = '';
  try { ranges = wordBookmarks(editor.state.doc); } catch (cause) { rangeError = (cause as Error).message; }
  const stale = editor.isDestroyed || editor.state.doc !== snapshot.doc;
  const blocked = stale || !editor.isEditable || composing || editor.view.composing || !!rangeError;
  const perform = (action: () => void) => {
    if (blocked) return;
    try {
      editor.view.dispatch(editor.state.tr.setSelection(snapshot.selection));
      action(); setSnapshot({ doc: editor.state.doc, selection: editor.state.selection }); setError('');
    } catch (cause) { setError((cause as Error).message); }
  };
  return <Modal open onOpenChange={open => { if (!open) onClose(); }}>
    <Modal.Content>
      <Modal.Header><Modal.Title>管理书签</Modal.Title></Modal.Header>
      <Modal.Body>
        <label>书签名称<Input aria-label="书签名称" value={name} onChange={event => setName(event.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} /></label>
        <p>以字母或下划线开头，最多40个字母、数字或下划线。添加到当前光标或选区。</p>
        <Button disabled={blocked || !name} onClick={() => perform(() => { wordAddBookmark(editor, name, otherEditors.filter(item => !item.isDestroyed).map(item => item.state.doc)); setName(''); })}>添加书签</Button>
        {ranges.map(range => <div key={range.id}>
          <span>{range.name}</span>
          <Button aria-label={`跳转书签 ${range.name}`} disabled={composing || editor.isDestroyed} onClick={() => { wordGoToBookmark(editor, range.name, true); onClose(); }}>跳转</Button>
          <Button aria-label={`删除书签 ${range.name}`} disabled={blocked} onClick={() => perform(() => { wordRemoveBookmark(editor, range.name); })}>删除</Button>
        </div>)}
        {(error || rangeError || stale) && <p role="alert">{error || rangeError || '文档已变化，请关闭后重新打开书签管理。'}</p>}
      </Modal.Body>
      <Modal.Footer><Button onClick={onClose}>关闭</Button></Modal.Footer>
    </Modal.Content>
  </Modal>;
}
