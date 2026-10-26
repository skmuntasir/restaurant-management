import React from 'react'
import logo from '../../assets/images/logo.png'

const FullScreenLoader = () => {
  return (
    <div className='fullscreen-loader' role="status" aria-live="polite">
      <div className='flex flex-col items-center gap-5'>
        <div className='relative'>
          <div className='spinner'></div>
          <img src={logo} alt="" className='absolute inset-0 m-auto h-6 w-6 object-contain' />
        </div>
        <p className='text-ink-2 text-xs tracking-widest uppercase'>Loading Red Wood…</p>
      </div>
    </div>
  )
}

export default FullScreenLoader
