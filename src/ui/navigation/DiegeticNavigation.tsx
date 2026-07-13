import { useEffect, useState } from 'react';
import { useUiTheme } from '../../state';
import { Icon, type IconName } from '../icons';
import './navigation.css';

type NavigationEntry = { label: string; icon: IconName };

const ENTRIES: NavigationEntry[] = [
  { label: 'Персонаж', icon: 'character' },
  { label: 'Город', icon: 'city' },
  { label: 'Жильё', icon: 'home' },
  { label: 'Бизнес', icon: 'building' },
  { label: 'Работа', icon: 'work' },
  { label: 'Развитие', icon: 'growth' },
  { label: 'Спорт', icon: 'boxing' },
  { label: 'Люди', icon: 'users' },
  { label: 'Журнал', icon: 'log' }
];

function activateDashboardTab(label: string): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.desktop-navigation .navigation-item, .mobile-navigation button'));
  const target = buttons.find((button) => button.textContent?.trim().includes(label));
  target?.click();
}

export function DiegeticNavigation({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useUiTheme();

  useEffect(() => {
    document.body.classList.add('diegetic-navigation-enabled');
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'm') setOpen((value) => !value);
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('diegetic-navigation-enabled');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <>
      <button className="diegetic-menu-button" type="button" aria-label="Открыть разделы" onClick={() => setOpen(true)}>
        <span/><span/><span/><b>Разделы</b><kbd>M</kbd>
      </button>
      <div className={`diegetic-nav-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <button className="diegetic-nav-backdrop" type="button" aria-label="Закрыть меню" onClick={() => setOpen(false)}/>
        <aside className="diegetic-nav-drawer">
          <header><div><span>LifeSim</span><strong>Городская жизнь</strong></div><button type="button" onClick={() => setOpen(false)}><Icon name="close" size={18}/></button></header>
          <nav>
            {ENTRIES.map((entry) => (
              <button key={entry.label} type="button" onClick={() => { activateDashboardTab(entry.label); setOpen(false); }}>
                <Icon name={entry.icon} size={20}/><span>{entry.label}</span><Icon name="chevron" size={15}/>
              </button>
            ))}
          </nav>
          <footer>
            <button type="button" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18}/><span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span></button>
            <button className="danger" type="button" onClick={() => { if (window.confirm('Сбросить сохранение LifeSim?')) onReset(); }}><Icon name="reset" size={18}/><span>Сбросить игру</span></button>
          </footer>
        </aside>
      </div>
    </>
  );
}
