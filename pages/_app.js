// pages/_app.js
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  // If a page defines getLayout, use it; otherwise render the page as-is.
  const getLayout = Component.getLayout || ((page) => page);
  return getLayout(<Component {...pageProps} />);
}
