import { PropsWithChildren } from 'react';
import './app.scss';

function App({ children }: PropsWithChildren) {
  return children as React.ReactElement;
}

export default App;
