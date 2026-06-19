import React from 'react'
import Navbar from '../../components/Navbar/Navbar'
import Hero from '../../components/Hero/Hero'
import Quote from '../../components/Quote/Quote'
import WhyParticipate from '../../components/WhyParticipate/WhyParticipate'
import Rules from '../../components/Rules/Rules'
import Jury from '../../components/Jury/Jury'
import CTA from '../../components/CTA/CTA'
import Footer from '../../components/Footer/Footer'

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <main>
        <Hero />
        <Quote />
        <WhyParticipate />
        <Rules />
        <Jury />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

export default Home;
