import React from 'react';
import { Link, useParams } from 'react-router-dom';
const pages = {
  sizing: { title: 'Sizing guide', content: 'Sizing varies by brand and product. Check the sizes listed on each product before ordering. Shoe sizes and clothing labels are shown exactly as provided for that product.' },
  support: { title: 'Order help', content: 'Open My Orders to view payment and fulfillment status. If a payment was interrupted, use Check payment status before trying again. Keep your order ID and payment ID when contacting the store.' },
};
export default function InfoPage() {
  const { topic } = useParams();
  const page = pages[topic];
  if (!page) return <NotFound />;
  return <div className="page-padding"><h1>{page.title}</h1><p>{page.content}</p><Link className="btn btn-primary mt-2" to="/profile">My Orders</Link>{process.env.REACT_APP_SUPPORT_EMAIL && <p><a href={`mailto:${process.env.REACT_APP_SUPPORT_EMAIL}`}>Contact support</a></p>}</div>;
}
export function NotFound() {
  return <div className="page-padding"><h1>Page not found</h1><p>The page may have moved or is no longer available.</p><Link className="btn btn-primary mt-2" to="/products">Browse products</Link></div>;
}
