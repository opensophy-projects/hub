export interface ContactItem {
  href: string;
  title: string;
  subtitle: string;
  external: boolean;
}

export const CONTACTS: ContactItem[] = [
  { href: 'https://hub.com/', title: 'Сайт', subtitle: 'hub.com', external: true },
  { href: 'mailto:hub@gmail.com', title: 'Email', subtitle: 'hub@gmail.com', external: false },
  { href: 'https://github.com/hub-projects', title: 'GitHub', subtitle: 'hub', external: true },
  { href: 'https://habr.com/ru/users/hub/', title: 'Habr', subtitle: 'hub', external: true },
];
