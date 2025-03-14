'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          <div className="flex flex-col md:flex-row md:space-x-8">
            
            <div>
              <h4 className="text-lg font-semibold mb-2">External Resources</h4>
              <ul className="space-y-1">
                <li>
                  <a 
                    href="https://en.xen.wiki/w/31edo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    Xenharmonic Wiki
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.facebook.com/groups/xenharmonic/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    Xenharmonic Community
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-gray-400">
          <p>© {new Date().getFullYear()} 31-EDO Explorer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 