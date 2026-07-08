import styles from  './App.module.css'
import { Builder } from './components/builder/Builder'
import { ReviewPanel } from './components/review/ReviewPanel'
import { BundleProvider } from './state/BundleContext'

function App() {

  return (
    <BundleProvider>
      <main className={styles.layout}>
        <Builder />
        <ReviewPanel />
      </main>
    </BundleProvider>
  )
}

export default App
