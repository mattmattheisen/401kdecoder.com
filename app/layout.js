export const metadata = {
  title: 'Plan Decoder',
  description: 'Analyze 401(k)/403(b) statements for fees & allocation.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
