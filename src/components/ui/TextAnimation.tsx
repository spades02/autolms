'use client'
import React from 'react'
import { ReactTyped } from 'react-typed';

export default function TextAnimation() {
  return (
    
      <ReactTyped
        strings={["Teachers", "Lecturers", "Course Instructors"]}
        typeSpeed={100}
        loop
        backSpeed={20}
        showCursor={true}
      />
    
  );
}
