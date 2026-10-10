import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const names = { '/': 'Sneakers & Streetwear', '/products': 'Shop', '/cart': 'Your Cart', '/checkout': 'Checkout', '/profile': 'My Account', '/login': 'Sign In', '/register': 'Create Account', '/help/sizing': 'Sizing Guide', '/help/support': 'Order Help' };
    document.title = `${names[pathname] || (pathname.startsWith('/admin') ? 'Administration' : 'DripStore')} | DripStore`;
  }, [pathname]);
  return null;
}
