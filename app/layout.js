import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Untuk Esok | Hari ini menanam aksi, esok menuai inspirasi.',
  description: 'Komunitas pelajar yang bergerak untuk menciptakan perubahan positif.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Navbar />

        <main>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  )
}