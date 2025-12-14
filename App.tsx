import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Moon, Sun, Calculator as CalcIcon } from 'lucide-react';
import SecretModal from './components/SecretModal';
import SidePanel from './components/SidePanel';
import { generateAdvancedResponse } from './services/geminiService';
import { CalculationResult } from './types';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState(''); // Stores the logic string
  const [isRad, setIsRad] = useState(false); // Radians vs Degrees
  const [memory, setMemory] = useState<number>(0);
  
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnswer, setLastAnswer] = useState('0');

  // Initialize theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // --- Calculator Logic ---

  const handleInput = (val: string) => {
    if (display === 'Error') {
      setDisplay(val);
      return;
    }
    if (display === '0' && val !== '.') {
      setDisplay(val);
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (display === 'Error') {
      handleClear();
      return;
    }
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleFunction = (func: string) => {
    // For functions like sin(, log(, etc.
    if (display === '0') {
      setDisplay(func + '(');
    } else {
      setDisplay(prev => prev + func + '(');
    }
  };

  const handleConstant = (constName: string, constVal: string) => {
     if (display === '0') {
       setDisplay(constName);
     } else {
       setDisplay(prev => prev + constName);
     }
  };

  const calculate = () => {
    try {
      let expression = display;

      // Replace constants and visual representations with JS Math equivalent
      expression = expression.replace(/×/g, '*')
                           .replace(/÷/g, '/')
                           .replace(/π/g, 'Math.PI')
                           .replace(/e/g, 'Math.E')
                           .replace(/Ans/g, lastAnswer);

      // Handle Scientific Functions
      const trigFunctions = ['sin', 'cos', 'tan'];
      
      trigFunctions.forEach(func => {
         if (!isRad) {
           // Simplified handling for degrees in this context
         }
         expression = expression.split(func + '(').join(`Math.${func}(`);
      });

      // Handle other functions
      expression = expression.replace(/ln\(/g, 'Math.log(');
      expression = expression.replace(/log\(/g, 'Math.log10(');
      expression = expression.replace(/√\(/g, 'Math.sqrt(');
      expression = expression.replace(/\^/g, '**');

      // Inverse Trig
      expression = expression.replace(/sin⁻¹\(/g, 'Math.asin(');
      expression = expression.replace(/cos⁻¹\(/g, 'Math.acos(');
      expression = expression.replace(/tan⁻¹\(/g, 'Math.atan(');

      // Factorial implementation (basic for small integers)
      if (expression.includes('!')) {
         expression = expression.replace(/(\d+)!/g, (match, num) => {
             let n = parseInt(num);
             if (n < 0) return 'NaN';
             let r = 1;
             for(let i=2; i<=n; i++) r *= i;
             return r.toString();
         });
      }

      // Safe eval
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expression)();
      
      // Formatting
      let finalResult = result;
      if (!isFinite(finalResult) || isNaN(finalResult)) {
        finalResult = 'Error';
      } else {
        // Limit decimals to fit screen
        finalResult = parseFloat(result.toFixed(10)).toString();
      }

      setLastAnswer(finalResult);
      setEquation(display + ' =');
      setDisplay(finalResult);
      
      // Save to history
      const newResult: CalculationResult = {
        id: Date.now().toString(),
        type: 'math',
        input: display,
        output: finalResult,
        timestamp: Date.now()
      };
      setResults(prev => [...prev, newResult]);

    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleMemory = (op: 'M+' | 'M-' | 'MR') => {
    const current = parseFloat(display);
    if (isNaN(current)) return;

    if (op === 'M+') setMemory(m => m + current);
    if (op === 'M-') setMemory(m => m - current);
    if (op === 'MR') setDisplay(memory.toString());
  };

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    
    // Numbers
    if (/[0-9]/.test(key)) { 
      e.preventDefault(); 
      handleInput(key); 
    }
    
    // Operators
    if (['+', '-', '*', '/', '(', ')', '.', '%', '^'].includes(key)) {
      e.preventDefault();
      let input = key;
      if (key === '*') input = '×';
      if (key === '/') input = '÷';
      handleInput(input);
    }

    // Actions
    if (key === 'Enter' || key === '=') { 
      e.preventDefault(); 
      calculate(); 
    }
    if (key === 'Backspace') { 
      e.preventDefault(); 
      handleBackspace(); 
    }
    if (key === 'Escape') { 
      e.preventDefault(); 
      handleClear(); 
    }

  }, [display]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // --- Helper Components ---

  const CalcButton = ({ label, onClick, className = "", variant = "default" }: any) => {
    let baseStyles = "relative h-10 sm:h-12 w-full rounded text-sm sm:text-base font-medium transition-all duration-75 active:top-[2px] active:shadow-none select-none flex items-center justify-center border-b-2";
    
    let colorStyles = "";
    if (variant === "default") {
      // Light grey / White - Numbers
      colorStyles = "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-zinc-900 shadow-key hover:bg-gray-50 dark:hover:bg-zinc-700";
    } else if (variant === "secondary") {
      // Darker grey - Scientific functions
      colorStyles = "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-zinc-900 shadow-key hover:bg-slate-300 dark:hover:bg-zinc-600";
    } else if (variant === "primary") {
      // Blue - Action keys
      colorStyles = "bg-blue-600 text-white border-blue-800 shadow-key hover:bg-blue-500";
    } else if (variant === "danger") {
      // Red/Orange - AC/Clear
      colorStyles = "bg-blue-100 text-blue-900 border-blue-200 shadow-key hover:bg-blue-200";
    }

    return (
      <button onClick={onClick} className={`${baseStyles} ${colorStyles} ${className}`}>
        {label}
      </button>
    );
  };

  const handleSecretSubmit = async (text: string, image: string | null) => {
    setIsProcessing(true);
    try {
      const response = await generateAdvancedResponse(text, image);
      const newResult: CalculationResult = {
        id: Date.now().toString(),
        type: 'advanced',
        input: text || '[Image Input]',
        output: response,
        timestamp: Date.now()
      };
      setResults(prev => [...prev, newResult]);
    } catch (e) {
      console.error(e);
      // Show error in the results panel
      const errorResult: CalculationResult = {
        id: Date.now().toString(),
        type: 'advanced',
        input: 'System Message',
        output: "Failed to connect to the intelligent engine. Please check your network or API configuration.",
        timestamp: Date.now()
      };
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsProcessing(false);
      setIsSecretModalOpen(false);
      setIsSidePanelOpen(true);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans overflow-hidden">
      
      {/* Secret Button - Fixed at top left of screen */}
      <button
        onClick={() => setIsSecretModalOpen(true)}
        className="fixed top-4 left-4 w-3 h-3 bg-red-500 rounded-full z-[60] hover:bg-red-600 cursor-default hover:cursor-pointer transition-all opacity-20 hover:opacity-100"
        aria-label="Advanced Mode"
        title=" "
      />

      {/* Navigation */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex-none z-40 pl-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <CalcIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">SciCalc<span className="text-blue-600">Pro</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium">Calculators</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                onClick={() => setIsSidePanelOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Calculator - Fits screen */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
          
          {/* Main Content Area / Calculator */}
          <div className="lg:col-span-8 flex flex-col items-center">
            
            <div className="w-full max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center lg:text-left">
                Online Scientific Calculator
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-center lg:text-left">
                Free, robust, and easy-to-use scientific calculator with advanced features.
              </p>

              {/* Calculator Container */}
              <div className="bg-gray-200 dark:bg-zinc-800 p-2 sm:p-4 rounded-xl shadow-2xl border border-gray-300 dark:border-zinc-700 relative">
                
                {/* Display Screen */}
                <div className="bg-[#263238] rounded-t-lg p-4 mb-3 shadow-inner border-b-4 border-gray-400 dark:border-zinc-600">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex gap-2 text-[10px] text-white/60 uppercase font-bold tracking-wider">
                      <span className={!isRad ? "text-white" : ""}>Deg</span>
                      <span className={isRad ? "text-white" : ""}>Rad</span>
                    </div>
                    <div className="text-white/40 text-sm font-mono h-6 overflow-hidden">
                      {equation}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl text-white font-mono tracking-wider overflow-hidden whitespace-nowrap">
                      {display}
                    </div>
                  </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-zinc-800/50 rounded-b-lg">
                  
                  {/* Row 1 */}
                  <div className="col-span-3 bg-white dark:bg-zinc-900 rounded p-1 flex items-center justify-around border border-gray-200 dark:border-zinc-700 mb-1">
                     <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                       <input type="radio" checked={!isRad} onChange={() => setIsRad(false)} className="accent-blue-600" /> Deg
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                       <input type="radio" checked={isRad} onChange={() => setIsRad(true)} className="accent-blue-600" /> Rad
                     </label>
                  </div>
                  <div className="col-span-2"></div>

                  {/* Row 2 */}
                  <CalcButton label="sin" variant="secondary" onClick={() => handleFunction('sin')} />
                  <CalcButton label="cos" variant="secondary" onClick={() => handleFunction('cos')} />
                  <CalcButton label="tan" variant="secondary" onClick={() => handleFunction('tan')} />
                  <CalcButton label="π" variant="secondary" onClick={() => handleConstant('π', 'Math.PI')} />
                  <CalcButton label="e" variant="secondary" onClick={() => handleConstant('e', 'Math.E')} />

                  {/* Row 3 */}
                  <CalcButton label={<span>sin⁻¹</span>} variant="secondary" onClick={() => handleFunction('sin⁻¹')} />
                  <CalcButton label={<span>cos⁻¹</span>} variant="secondary" onClick={() => handleFunction('cos⁻¹')} />
                  <CalcButton label={<span>tan⁻¹</span>} variant="secondary" onClick={() => handleFunction('tan⁻¹')} />
                  <CalcButton label="eˣ" variant="secondary" onClick={() => handleInput('e^(')} />
                  <CalcButton label="10ˣ" variant="secondary" onClick={() => handleInput('10^(')} />

                  {/* Row 4 */}
                  <CalcButton label="x²" variant="secondary" onClick={() => handleInput('^2')} />
                  <CalcButton label="x³" variant="secondary" onClick={() => handleInput('^3')} />
                  <CalcButton label="xʸ" variant="secondary" onClick={() => handleInput('^')} />
                  <CalcButton label="ln" variant="secondary" onClick={() => handleFunction('ln')} />
                  <CalcButton label="log" variant="secondary" onClick={() => handleFunction('log')} />

                  {/* Row 5 */}
                  <CalcButton label="√" variant="secondary" onClick={() => handleFunction('√')} />
                  <CalcButton label="(" variant="secondary" onClick={() => handleInput('(')} />
                  <CalcButton label=")" variant="secondary" onClick={() => handleInput(')')} />
                  <CalcButton label="1/x" variant="secondary" onClick={() => handleInput('^(-1)')} />
                  <CalcButton label="%" variant="secondary" onClick={() => handleInput('%')} />

                  {/* Row 6 */}
                  <CalcButton label="7" onClick={() => handleInput('7')} />
                  <CalcButton label="8" onClick={() => handleInput('8')} />
                  <CalcButton label="9" onClick={() => handleInput('9')} />
                  <CalcButton label="DEL" variant="danger" className="bg-red-50 text-red-900 hover:bg-red-100 border-red-200" onClick={handleBackspace} />
                  <CalcButton label="AC" variant="danger" className="bg-red-50 text-red-900 hover:bg-red-100 border-red-200" onClick={handleClear} />

                  {/* Row 7 */}
                  <CalcButton label="4" onClick={() => handleInput('4')} />
                  <CalcButton label="5" onClick={() => handleInput('5')} />
                  <CalcButton label="6" onClick={() => handleInput('6')} />
                  <CalcButton label="×" variant="secondary" onClick={() => handleInput('×')} />
                  <CalcButton label="÷" variant="secondary" onClick={() => handleInput('÷')} />

                  {/* Row 8 */}
                  <CalcButton label="1" onClick={() => handleInput('1')} />
                  <CalcButton label="2" onClick={() => handleInput('2')} />
                  <CalcButton label="3" onClick={() => handleInput('3')} />
                  <CalcButton label="+" variant="secondary" onClick={() => handleInput('+')} />
                  <CalcButton label="-" variant="secondary" onClick={() => handleInput('-')} />

                  {/* Row 9 */}
                  <CalcButton label="0" onClick={() => handleInput('0')} />
                  <CalcButton label="." onClick={() => handleInput('.')} />
                  <CalcButton label="Ans" variant="secondary" onClick={() => handleConstant('Ans', lastAnswer)} />
                  <CalcButton label="EXP" variant="secondary" onClick={() => handleInput('e')} />
                  <CalcButton label="=" variant="primary" className="row-span-1 shadow-blue-900/20" onClick={calculate} />

                  {/* Row 10 - Memory */}
                  <div className="col-span-5 grid grid-cols-5 gap-2 mt-1 pt-2 border-t border-gray-300 dark:border-zinc-700">
                    <CalcButton label="M+" variant="secondary" className="text-xs h-8 sm:h-8" onClick={() => handleMemory('M+')} />
                    <CalcButton label="M-" variant="secondary" className="text-xs h-8 sm:h-8" onClick={() => handleMemory('M-')} />
                    <CalcButton label="MR" variant="secondary" className="text-xs h-8 sm:h-8" onClick={() => handleMemory('MR')} />
                    <CalcButton label="n!" variant="secondary" className="text-xs h-8 sm:h-8" onClick={() => handleInput('!')} />
                    <CalcButton label="RND" variant="secondary" className="text-xs h-8 sm:h-8" onClick={() => handleInput(Math.random().toFixed(4))} />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Ads & Links */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Ad Placeholder 1 */}
            <div className="bg-gray-100 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700 h-64 flex flex-col items-center justify-center relative overflow-hidden group">
               <span className="text-xs font-semibold text-gray-400 absolute top-2 right-2 border border-gray-300 px-1 rounded">Ad</span>
               <div className="text-center p-4">
                 <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Master Mathematics Today</h4>
                 <p className="text-sm text-gray-500 mb-4">Join 10,000+ students learning calculus online.</p>
                 <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Start Free Trial</button>
               </div>
            </div>

            {/* Popular Tools */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-zinc-700">Popular Tools</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Graphing Calculator</a></li>
                <li><a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Percentage Calculator</a></li>
                <li><a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Fraction Simplifier</a></li>
              </ul>
            </div>

             {/* Ad Placeholder 2 */}
            <div className="bg-gray-100 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700 h-64 flex flex-col items-center justify-center relative overflow-hidden">
               <span className="text-xs font-semibold text-gray-400 absolute top-2 right-2 border border-gray-300 px-1 rounded">Ad</span>
               <div className="text-center p-4">
                 <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Finance for Engineers</h4>
                 <p className="text-sm text-gray-500 mb-4">Learn how to manage your finances with data.</p>
                 <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Learn More</button>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <SecretModal 
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
        onSubmit={handleSecretSubmit}
        isLoading={isProcessing}
      />

      <SidePanel 
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        results={results}
      />
    </div>
  );
}

export default App;