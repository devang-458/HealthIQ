import { Navbar } from '../components/landing/navbar'
import { Hero } from '../components/landing/hero'
import { Features } from '../components/landing/feature'
import { HowItWorks } from '../components/landing/how-it-works'
import { Benefits } from '../components/landing/benefits'
import { Testimonials } from '../components/landing/testimonials'
import { CTA } from '../components/landing/cta'
import { Footer } from '../components/landing/footer'

export default function HomePage() {
  return (
    <div className=" bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}