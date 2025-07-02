'use client'

import React from 'react'
import axios from 'axios'
import { useLocalStorage } from 'usehooks-ts'

const Test = () => {
  const [jwt] = useLocalStorage("jwt", "");
  
  const handleClick = async () => {
    const res = await axios.post("/api/vote", {
      matchId: "415345386",
      botChosen: "Team02",
      amount: 50,
      jwt: jwt,
    })
  }

  return (
    <button className='hover: cursor-pointer' onClick={handleClick}>button</button>
  )
}

export default Test