export interface ContactItem {
  href: string;
  title: string;
  subtitle: string;
  /** Открывать в новой вкладке */
  external: boolean;
}

export const CONTACTS: ContactItem[] = [
  { href: 'https://opensophy.com/', title: 'Сайт', subtitle: 'opensophy.com', external: true },
  { href: 'mailto:opensophy@gmail.com', title: 'Email', subtitle: 'opensophy@gmail.com', external: false },
  { href: 'https://github.com/opensophy-projects', title: 'GitHub', subtitle: 'opensophy', external: true },
  { href: 'https://habr.com/ru/users/opensophy/', title: 'Habr', subtitle: 'opensophy', external: true },
  { href: 'https://www.reddit.com/user/opensophy/', title: 'Reddit', subtitle: 'opensophy', external: true },
  { href: 'https://hackernoon.com/u/opensophy', title: 'Hackernoon', subtitle: ' @opensophy', external: true },
];
