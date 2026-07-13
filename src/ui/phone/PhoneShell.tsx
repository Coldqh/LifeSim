import { useEffect, useMemo, useState } from 'react';
import { formatGameTime } from '../../core/time';
import { Icon } from '../icons';
import { PhoneAppRouter } from './PhoneAppRouter';
import { PhoneHome } from './PhoneHome';
import { APP_META, AppBadge } from './phoneShared';
import type { PhoneShellProps } from './phoneTypes';
import './phone.css';

export function PhoneShell(props: PhoneShellProps) {
  const [mounted, setMounted] = useState(props.open);
  const appTitle = useMemo(() => APP_META.find((entry) => entry.id === props.activeApp)?.label ?? 'Телефон', [props.activeApp]);

  useEffect(() => {
    if (props.open) setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'p') props.open ? props.onClose() : props.onOpen();
      if (event.key === 'Escape' && props.open) props.onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose, props.onOpen]);

  if (!mounted && !props.open) {
    return (
      <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
        <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
      </button>
    );
  }

  return (
    <>
      {!props.open ? (
        <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
          <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
        </button>
      ) : null}
      <div className={`phone-overlay ${props.open ? 'is-open' : 'is-closing'}`} onAnimationEnd={() => { if (!props.open) setMounted(false); }}>
        <button className="phone-overlay__backdrop" type="button" aria-label="Закрыть телефон" onClick={props.onClose}/>
        <aside className="diegetic-phone" aria-label="Смартфон персонажа">
          <div className="diegetic-phone__hardware"><i/><i/><i/></div>
          <div className="diegetic-phone__screen">
            <header className="phone-status-bar">
              <strong>{formatGameTime(props.time)}</strong>
              <span>5G <i className="phone-signal"/> 87%</span>
            </header>
            {props.activeApp !== 'home' ? (
              <header className="phone-app-header">
                <button type="button" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}><Icon name="chevron" size={20}/></button>
                <strong>{appTitle}</strong>
                <button type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>
              </header>
            ) : <button className="phone-close-button" type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>}
            <div className="phone-app-content">
              {props.activeApp === 'home' ? <PhoneHome state={props.state} onOpenApp={props.onOpenApp}/> : <PhoneAppRouter {...props}/>}
            </div>
            <button className="phone-home-indicator" type="button" aria-label="На главный экран" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}/>
          </div>
        </aside>
      </div>
    </>
  );
}
