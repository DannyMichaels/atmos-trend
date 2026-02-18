import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AtmosTrend',
  description: 'AtmosTrend is an incredibly powerful WeatherApp featuring an interactive 3D globe powered by Three.js. It uses your location to provide accurate and up-to-date information with a series of detailed charts. Not only does it include a UV index, temperature chart, rain chart, and humidity chart - all of these are generated and summarized with their own AI models. Try it out now and get the most comprehensive weather forecast available.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
