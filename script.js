/* ============================================================
   EMI PRO – script.js
   Author  : Sabari Balaji C K
   Project : EMI Calculator – JavaScript Workshop Project
   Stack   : Vanilla JavaScript (ES6+)

   CONTENTS
   --------
   1.  DOM Element References
   2.  Utility – formatCurrency()
   3.  Utility – formatPercent()
   4.  Utility – formatMonths()
   5.  Utility – debounce()
   6.  Validation – validateField()  (single-field helper)
   7.  Validation – validateMainForm()
   8.  Validation – validateCompareForm()
   9.  Calculation – calculateEMI()
   10. Calculation – buildAmortizationSchedule()
   11. Display – updateDonutChart()
   12. Display – displayResults()
   13. Display – showPlaceholder()
   14. Display – buildScheduleTable()
   15. Display – clearSchedule()
   16. Display – displayCompareResults()
   17. Reset – resetCalculator()
   18. Reset – resetComparison()
   19. Feature – applyPreset()
   20. Feature – downloadPDF()
   21. Feature – themeToggle()
   22. Feature – mobileNav()
   23. Feature – sliderSync()
   24. Event Listeners (main calculator)
   25. Event Listeners (comparison tool)
   26. Event Listeners (presets, export, theme, nav)
   27. Initialisation
   ============================================================ */

'use strict';

/* -----------------------------------------------------------
   1. DOM ELEMENT REFERENCES
   All DOM elements are cached here once so we never query
   the DOM repeatedly inside loops or event handlers.
   ----------------------------------------------------------- */

// ---- Main Calculator Form ----
const emiForm              = document.getElementById('emiForm');
const loanTypeSelect       = document.getElementById('loanType');
const loanTypeBadge        = document.getElementById('loanTypeBadge');
const loanTypeBadgeText    = document.getElementById('loanTypeBadgeText');
const benchmarkStatusPill  = document.getElementById('benchmarkStatusPill');
const resetToBenchmarkBtn  = document.getElementById('resetToBenchmarkBtn');
const principalInput       = document.getElementById('principal');
const rateInput            = document.getElementById('rate');
const tenureInput          = document.getElementById('tenure');
const tenureUnit           = document.getElementById('tenureUnit');
const calculateBtn         = document.getElementById('calculateBtn');
const resetBtn             = document.getElementById('resetBtn');

// Loan selection prompt & container
const noLoanSelectedPrompt = document.getElementById('noLoanSelectedPrompt');
const loanInputsContainer   = document.getElementById('loanInputsContainer');
const selectedLoanTitle     = document.getElementById('selectedLoanTitle');

// Input wrappers (for error-state CSS class)
const wrapperPrincipal = document.getElementById('wrapper-principal');
const wrapperRate      = document.getElementById('wrapper-rate');
const wrapperTenure    = document.getElementById('wrapper-tenure');

// Error paragraphs
const errorPrincipal   = document.getElementById('principal-error');
const errorRate        = document.getElementById('rate-error');
const errorTenure      = document.getElementById('tenure-error');

// Range sliders
const principalSlider  = document.getElementById('principalSlider');
const rateSlider       = document.getElementById('rateSlider');
const tenureSlider     = document.getElementById('tenureSlider');
const tenureSliderMin  = document.getElementById('tenureSliderMin');
const tenureSliderMax  = document.getElementById('tenureSliderMax');

// Result display elements
const placeholderMsg   = document.getElementById('placeholderMsg');
const outdatedBanner   = document.getElementById('outdatedBanner');
const resultsContainer = document.getElementById('resultsContainer');
const resultEMI        = document.getElementById('result-emi');
const resultLoanType   = document.getElementById('result-loan-type');
const resultPrincipal  = document.getElementById('result-principal');
const resultInterest   = document.getElementById('result-interest');
const resultTotal      = document.getElementById('result-total');
const resultRate       = document.getElementById('result-rate');
const resultTenureMonths = document.getElementById('result-tenure-months');

// State tracking: whether an explicit calculation has been performed
let hasCalculated = false;

function markResultsOutdated() {
  if (!hasCalculated) return;
  if (outdatedBanner) outdatedBanner.hidden = false;
  if (resultsContainer) resultsContainer.classList.add('is-outdated');
  if (scheduleContainer) scheduleContainer.classList.add('is-outdated');
}

function clearOutdatedState() {
  if (outdatedBanner) outdatedBanner.hidden = true;
  if (resultsContainer) resultsContainer.classList.remove('is-outdated');
  if (scheduleContainer) scheduleContainer.classList.remove('is-outdated');
}

// Centralized, configurable benchmark dataset for all 12 loan categories
// Contains representative benchmark figures and typical prevailing rate ranges.
const LOAN_BENCHMARKS = {
  'home': {
    name: 'Home Loan',
    suggestedAmount: 5000000,
    suggestedRate: 8.5,
    suggestedTenure: 20,
    tenureUnit: 'years',
    rateRangeMin: 8.5,
    rateRangeMax: 9.5,
    formattedAmount: '₹50L',
    tenureDisplay: '20 Yrs'
  },
  'personal': {
    name: 'Personal Loan',
    suggestedAmount: 300000,
    suggestedRate: 13.5,
    suggestedTenure: 3,
    tenureUnit: 'years',
    rateRangeMin: 11.5,
    rateRangeMax: 18.0,
    formattedAmount: '₹3L',
    tenureDisplay: '3 Yrs'
  },
  'car': {
    name: 'Car Loan',
    suggestedAmount: 800000,
    suggestedRate: 9.0,
    suggestedTenure: 5,
    tenureUnit: 'years',
    rateRangeMin: 8.7,
    rateRangeMax: 10.5,
    formattedAmount: '₹8L',
    tenureDisplay: '5 Yrs'
  },
  'two-wheeler': {
    name: 'Two-Wheeler Loan',
    suggestedAmount: 100000,
    suggestedRate: 12.0,
    suggestedTenure: 3,
    tenureUnit: 'years',
    rateRangeMin: 10.5,
    rateRangeMax: 16.0,
    formattedAmount: '₹1L',
    tenureDisplay: '3 Yrs'
  },
  'education': {
    name: 'Education Loan',
    suggestedAmount: 1500000,
    suggestedRate: 9.5,
    suggestedTenure: 7,
    tenureUnit: 'years',
    rateRangeMin: 9.0,
    rateRangeMax: 12.5,
    formattedAmount: '₹15L',
    tenureDisplay: '7 Yrs'
  },
  'business': {
    name: 'Business Loan',
    suggestedAmount: 2000000,
    suggestedRate: 14.0,
    suggestedTenure: 5,
    tenureUnit: 'years',
    rateRangeMin: 12.0,
    rateRangeMax: 18.0,
    formattedAmount: '₹20L',
    tenureDisplay: '5 Yrs'
  },
  'gold': {
    name: 'Gold Loan',
    suggestedAmount: 200000,
    suggestedRate: 8.0,
    suggestedTenure: 1,
    tenureUnit: 'years',
    rateRangeMin: 7.5,
    rateRangeMax: 11.0,
    formattedAmount: '₹2L',
    tenureDisplay: '1 Yr'
  },
  'property': {
    name: 'Loan Against Property',
    suggestedAmount: 3000000,
    suggestedRate: 10.0,
    suggestedTenure: 15,
    tenureUnit: 'years',
    rateRangeMin: 9.5,
    rateRangeMax: 11.5,
    formattedAmount: '₹30L',
    tenureDisplay: '15 Yrs'
  },
  'credit-card': {
    name: 'Loan Against Credit Card',
    suggestedAmount: 150000,
    suggestedRate: 16.0,
    suggestedTenure: 2,
    tenureUnit: 'years',
    rateRangeMin: 14.0,
    rateRangeMax: 20.0,
    formattedAmount: '₹1.5L',
    tenureDisplay: '2 Yrs'
  },
  'agriculture': {
    name: 'Agriculture Loan',
    suggestedAmount: 500000,
    suggestedRate: 7.0,
    suggestedTenure: 3,
    tenureUnit: 'years',
    rateRangeMin: 4.0,
    rateRangeMax: 7.0,
    formattedAmount: '₹5L',
    tenureDisplay: '3 Yrs'
  },
  'medical': {
    name: 'Medical Loan',
    suggestedAmount: 250000,
    suggestedRate: 11.5,
    suggestedTenure: 2,
    tenureUnit: 'years',
    rateRangeMin: 10.5,
    rateRangeMax: 14.0,
    formattedAmount: '₹2.5L',
    tenureDisplay: '2 Yrs'
  },
  'consumer-durable': {
    name: 'Consumer Durable Loan',
    suggestedAmount: 50000,
    suggestedRate: 13.0,
    suggestedTenure: 1,
    tenureUnit: 'years',
    rateRangeMin: 12.0,
    rateRangeMax: 16.0,
    formattedAmount: '₹50K',
    tenureDisplay: '1 Yr'
  }
};
// Alias for backwards compatibility
const LOAN_TYPE_CONFIGS = LOAN_BENCHMARKS;

/**
 * Format benchmark info string:
 * e.g., Benchmark: ₹50K · 13.0% p.a. · 1 Yr (Typical 12.0%–16.0%)
 */
function formatBenchmarkString(config) {
  if (!config) return '';
  return `Benchmark: ${config.formattedAmount} · ${config.suggestedRate.toFixed(1)}% p.a. · ${config.tenureDisplay} (Typical ${config.rateRangeMin.toFixed(1)}%–${config.rateRangeMax.toFixed(1)}%)`;
}

/**
 * Check if the user's current inputs deviate from the benchmark defaults
 */
function checkIsCustomized() {
  const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
  const config = LOAN_BENCHMARKS[selectedKey];
  if (!config) return false;

  const currentPrincipal = parseFloat(principalInput.value);
  const currentRate      = parseFloat(rateInput.value);
  const currentTenure    = parseFloat(tenureInput.value);
  const currentUnit      = tenureUnit.value;

  if (isNaN(currentPrincipal) || isNaN(currentRate) || isNaN(currentTenure)) return true;

  const isPrincipalSame = Math.abs(currentPrincipal - config.suggestedAmount) < 0.01;
  const isRateSame      = Math.abs(currentRate - config.suggestedRate) < 0.01;
  const isTenureSame    = Math.abs(currentTenure - config.suggestedTenure) < 0.01;
  const isUnitSame      = currentUnit === config.tenureUnit;

  return !(isPrincipalSame && isRateSame && isTenureSame && isUnitSame);
}

/**
 * Update the benchmark status badge (Default Benchmark vs Customized)
 * and show/hide the "Restore Defaults" button.
 */
function updateBenchmarkCustomStatus() {
  if (!loanTypeBadge || loanTypeBadge.hidden) return;
  const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
  const config = LOAN_BENCHMARKS[selectedKey];
  if (!config) return;

  const isCustom = checkIsCustomized();
  if (benchmarkStatusPill) {
    if (isCustom) {
      benchmarkStatusPill.textContent = 'Customized';
      benchmarkStatusPill.className = 'benchmark-status-pill benchmark-status-pill--custom';
      if (resetToBenchmarkBtn) resetToBenchmarkBtn.hidden = false;
    } else {
      benchmarkStatusPill.textContent = 'Default Benchmark';
      benchmarkStatusPill.className = 'benchmark-status-pill benchmark-status-pill--default';
      if (resetToBenchmarkBtn) resetToBenchmarkBtn.hidden = true;
    }
  }

  // Update Result Loan Type label if results are visible
  if (resultLoanType && !resultsContainer.hidden) {
    resultLoanType.textContent = config.name;
  }
}

/**
 * Load selected loan category into the form for manual entry.
 * Opens the manual input fields (Amount, Rate, Tenure in Years) completely blank.
 * Does NOT auto-fill default values.
 * Does NOT auto-calculate: user explicitly clicks "Calculate EMI" to calculate.
 */
function applyBenchmark(selectedKey) {
  const config = LOAN_BENCHMARKS[selectedKey];
  if (!config) return;

  // Reveal manual entry form and hide prompt
  if (noLoanSelectedPrompt) noLoanSelectedPrompt.hidden = true;
  if (loanInputsContainer)   loanInputsContainer.hidden = false;
  if (selectedLoanTitle)     selectedLoanTitle.textContent = config.name;

  // Manual entry: Leave fields blank for the user to enter manually
  principalInput.value = '';
  rateInput.value      = '';
  tenureInput.value    = '';
  tenureUnit.value     = 'years';

  // Synchronize range sliders to neutral initial values
  principalSlider.value = 500000;
  rateSlider.value      = 8.5;
  updateTenureSliderConfig();
  if (tenureSlider) tenureSlider.value = 5;

  // Clear validation errors
  clearError(principalInput, wrapperPrincipal, errorPrincipal);
  clearError(rateInput,      wrapperRate,      errorRate);
  clearError(tenureInput,    wrapperTenure,    errorTenure);

  // Sync loan selection cards in calculator form
  const loanTypeCards = document.querySelectorAll('.loan-type-card');
  loanTypeCards.forEach(function (card) {
    const cardVal = card.getAttribute('data-loan-value');
    if (cardVal === selectedKey) {
      card.classList.add('active', 'is-selected');
      card.setAttribute('aria-checked', 'true');
      try {
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (e) {}
    } else {
      card.classList.remove('active', 'is-selected');
      card.setAttribute('aria-checked', 'false');
    }
  });

  // Sync hidden select element
  if (loanTypeSelect && loanTypeSelect.value !== selectedKey) {
    loanTypeSelect.value = selectedKey;
  }

  // Clear scenario preset selected state
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach(function (card) {
    card.classList.remove('active', 'is-selected');
    card.setAttribute('aria-pressed', 'false');
    const badge = card.querySelector('.preset-card-badge');
    const applyText = card.querySelector('.preset-apply-text');
    if (badge) {
      badge.textContent = '';
      badge.hidden = true;
    }
    if (applyText) applyText.textContent = 'Populate scenario';
  });

  // Focus principal input so user can enter values manually right away
  try {
    principalInput.focus();
  } catch (e) {}

  // DO NOT calculate EMI automatically!
  // Reset results view to placeholder until user clicks "Calculate EMI"
  hasCalculated = false;
  showPlaceholder();
  clearSchedule();
  resetDonutChart();
  clearOutdatedState();
}

// Donut chart elements
const chartPrincipalArc = document.getElementById('chartPrincipalArc');
const chartInterestArc  = document.getElementById('chartInterestArc');
const chartCentreLabel  = document.getElementById('chartCentreLabel');
const chartCentreValue  = document.getElementById('chartCentreValue');
const legendPrincipal   = document.getElementById('legendPrincipal');
const legendInterest    = document.getElementById('legendInterest');

// ---- Amortization Schedule ----
const schedulePlaceholder = document.getElementById('schedulePlaceholder');
const scheduleContainer   = document.getElementById('scheduleContainer');
const scheduleInfo        = document.getElementById('scheduleInfo');
const amortTableBody      = document.getElementById('amortTableBody');
const downloadPdfBtn      = document.getElementById('downloadPdfBtn');

// ---- Comparison Tool ----
const compPrincipalA    = document.getElementById('compPrincipalA');
const compRateA         = document.getElementById('compRateA');
const compTenureA       = document.getElementById('compTenureA');
const compUnitA         = document.getElementById('compUnitA');
const wrapperCompPA     = document.getElementById('wrapper-compPrincipalA');
const wrapperCompRA     = document.getElementById('wrapper-compRateA');
const wrapperCompTA     = document.getElementById('wrapper-compTenureA');
const compErrorA        = document.getElementById('compA-error');

const compPrincipalB    = document.getElementById('compPrincipalB');
const compRateB         = document.getElementById('compRateB');
const compTenureB       = document.getElementById('compTenureB');
const compUnitB         = document.getElementById('compUnitB');
const wrapperCompPB     = document.getElementById('wrapper-compPrincipalB');
const wrapperCompRB     = document.getElementById('wrapper-compRateB');
const wrapperCompTB     = document.getElementById('wrapper-compTenureB');
const compErrorB        = document.getElementById('compB-error');

const compareBtn        = document.getElementById('compareBtn');
const resetCompareBtn   = document.getElementById('resetCompareBtn');
const compareResults    = document.getElementById('compareResults');
const compareDifference = document.getElementById('compareDifference');

const compResultEmiA      = document.getElementById('compResultEmiA');
const compResultInterestA = document.getElementById('compResultInterestA');
const compResultTotalA    = document.getElementById('compResultTotalA');
const compResultDurationA = document.getElementById('compResultDurationA');

const compResultEmiB      = document.getElementById('compResultEmiB');
const compResultInterestB = document.getElementById('compResultInterestB');
const compResultTotalB    = document.getElementById('compResultTotalB');
const compResultDurationB = document.getElementById('compResultDurationB');

// ---- Scenario Presets ----
const allPresetCards = document.querySelectorAll('.preset-card');

// ---- Theme & Nav ----
const themeToggle  = document.getElementById('themeToggle');
const navToggle    = document.getElementById('navToggle');
const mobileNav    = document.getElementById('mobileNav');

/* -----------------------------------------------------------
   Keep a module-level reference to the last valid schedule
   data so the CSV export always uses correct data.
   ----------------------------------------------------------- */
let lastSchedule     = [];
let lastScheduleInfo = { principal: 0, rate: 0, months: 0, emi: 0 };


/* ===========================================================
   2. UTILITY – formatCurrency(amount)

   Formats a number as Indian Rupees using Intl.NumberFormat.
   Example: 615561.60  →  "₹6,15,561.60"
   =========================================================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style               : 'currency',
    currency            : 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


/* ===========================================================
   3. UTILITY – formatPercent(rate)

   Displays annual interest rate without trailing zeros.
   Example: 8.50  →  "8.5%",  0  →  "0%"
   =========================================================== */
function formatPercent(rate) {
  const cleaned = parseFloat(rate.toFixed(6));
  return cleaned + '%';
}


/* ===========================================================
   4. UTILITY – formatMonths(months)

   Converts a month count to a human-readable string.
   Example: 60  →  "5 years",  14  →  "1 year 2 months"
   =========================================================== */
function formatMonths(months) {
  const yrs  = Math.floor(months / 12);
  const mths = months % 12;
  const parts = [];
  if (yrs  > 0) parts.push(yrs  + (yrs  === 1 ? ' year'  : ' years'));
  if (mths > 0) parts.push(mths + (mths === 1 ? ' month' : ' months'));
  return parts.length ? parts.join(' ') : months + ' months';
}


/* ===========================================================
   5. UTILITY – debounce(fn, delay)

   Returns a debounced version of fn that fires after
   the user stops calling it for `delay` milliseconds.
   Used to prevent excessive recalculation on slider moves.
   =========================================================== */
function debounce(fn, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}


/* ===========================================================
   6. VALIDATION – validateField(rawValue, rules)

   Generic validator for a single input value.

   rules: {
     required   : boolean  – reject empty strings
     allowZero  : boolean  – allow the value 0
     mustBePos  : boolean  – must be strictly > 0
     notNeg     : boolean  – must be >= 0
   }

   Returns: { ok: boolean, value: number|null, message: string }
   =========================================================== */
function validateField(rawValue, rules) {
  const trimmed = (rawValue !== null && rawValue !== undefined ? String(rawValue) : '').trim();

  if (trimmed === '') {
    if (rules.required) {
      return { ok: false, value: null, message: rules.emptyMsg || 'This field is required.' };
    }
    return { ok: true, value: null };
  }

  const num = parseFloat(trimmed);

  if (isNaN(num) || !isFinite(num)) {
    return { ok: false, value: null, message: 'Please enter a valid number.' };
  }

  if (rules.mustBePos && num <= 0) {
    return { ok: false, value: null, message: rules.posMsg || 'Must be greater than zero.' };
  }

  if (rules.notNeg && num < 0) {
    return { ok: false, value: null, message: rules.negMsg || 'Cannot be negative.' };
  }

  return { ok: true, value: num };
}


/* ===========================================================
   7. VALIDATION – validateMainForm()

   Reads the three main calculator inputs, validates them,
   and returns a result object.

   Returns:
   {
     isValid  : boolean,
     principal: number,  // ₹ amount
     rate     : number,  // annual % as decimal (e.g. 8.5)
     months   : number   // tenure in months
   }
   =========================================================== */
function validateMainForm(silent = false) {
  let isValid = true;

  // Clear previous errors first
  if (!silent) {
    clearError(principalInput, wrapperPrincipal, errorPrincipal);
    clearError(rateInput,      wrapperRate,      errorRate);
    clearError(tenureInput,    wrapperTenure,    errorTenure);
  }

  // --- Loan Amount ---
  const pResult = validateField(principalInput.value, {
    required : true,
    mustBePos: true,
    emptyMsg : 'Loan amount is required.',
    posMsg   : 'Loan amount must be greater than zero.',
  });
  if (!pResult.ok) {
    if (!silent) showError(principalInput, wrapperPrincipal, errorPrincipal, pResult.message);
    isValid = false;
  }

  // --- Annual Interest Rate (0% is allowed) ---
  const rResult = validateField(rateInput.value, {
    required : true,
    notNeg   : true,
    emptyMsg : 'Interest rate is required.',
    negMsg   : 'Interest rate cannot be negative.',
  });
  if (!rResult.ok) {
    if (!silent) showError(rateInput, wrapperRate, errorRate, rResult.message);
    isValid = false;
  }

  // --- Loan Tenure ---
  const tResult = validateField(tenureInput.value, {
    required : true,
    mustBePos: true,
    emptyMsg : 'Loan tenure is required.',
    posMsg   : 'Tenure must be greater than zero.',
  });
  let tenureMonths = NaN;
  if (!tResult.ok) {
    if (!silent) showError(tenureInput, wrapperTenure, errorTenure, tResult.message);
    isValid = false;
  } else {
    // Convert years → months if needed
    const unit = tenureUnit.value;
    tenureMonths = unit === 'years'
      ? Math.round(tResult.value * 12)
      : Math.round(tResult.value);

    if (tenureMonths < 1) {
      if (!silent) showError(tenureInput, wrapperTenure, errorTenure, 'Tenure must be at least 1 month.');
      isValid = false;
    }
  }

  return {
    isValid,
    principal: pResult.value,
    rate     : rResult.value,
    months   : tenureMonths,
  };
}


/* ===========================================================
   8. VALIDATION – validateCompareForm(scenario)

   Validates one comparison scenario (A or B).
   Returns { isValid, principal, rate, months } or error.
   =========================================================== */
function validateCompareForm(pInput, rInput, tInput, uSelect, pWrap, rWrap, tWrap, errorEl) {
  let isValid = true;
  let principal = NaN, rate = NaN, months = NaN;

  if (pWrap) pWrap.classList.remove('is-error');
  if (rWrap) rWrap.classList.remove('is-error');
  if (tWrap) tWrap.classList.remove('is-error');
  errorEl.textContent = '';
  errorEl.classList.remove('visible');

  const messages = [];

  // Principal
  const pRes = validateField(pInput.value, { required: true, mustBePos: true, emptyMsg: 'Loan amount required.', posMsg: 'Must be > 0.' });
  if (!pRes.ok) {
    messages.push(pRes.message);
    if (pWrap) pWrap.classList.add('is-error');
    isValid = false;
  } else {
    principal = pRes.value;
  }

  // Rate
  const rRes = validateField(rInput.value, { required: true, notNeg: true, emptyMsg: 'Rate required.', negMsg: 'Rate cannot be negative.' });
  if (!rRes.ok) {
    messages.push(rRes.message);
    if (rWrap) rWrap.classList.add('is-error');
    isValid = false;
  } else {
    rate = rRes.value;
  }

  // Tenure
  const tRes = validateField(tInput.value, { required: true, mustBePos: true, emptyMsg: 'Tenure required.', posMsg: 'Must be > 0.' });
  if (!tRes.ok) {
    messages.push(tRes.message);
    if (tWrap) tWrap.classList.add('is-error');
    isValid = false;
  } else {
    months = uSelect.value === 'years'
      ? Math.round(tRes.value * 12)
      : Math.round(tRes.value);
    if (months < 1) {
      messages.push('Tenure must be at least 1 month.');
      if (tWrap) tWrap.classList.add('is-error');
      isValid = false;
    }
  }

  if (!isValid) {
    errorEl.textContent = messages.join(' ');
    errorEl.classList.add('visible');
  }

  return { isValid, principal, rate, months };
}


/* ===========================================================
   9. CALCULATION – calculateEMI(principal, annualRate, months)

   Implements the standard EMI formula:
     EMI = P × r × (1 + r)^n  /  ((1 + r)^n - 1)

   Where:
     P = Principal loan amount
     r = Monthly interest rate  =  annualRate / 12 / 100
     n = Total number of monthly instalments

   ZERO INTEREST EDGE CASE:
     When annualRate = 0, the formula divides by zero.
     In that case: EMI = P / n

   Returns:
   { emi, totalRepayment, totalInterest }  or  null on error.
   =========================================================== */
function calculateEMI(principal, annualRate, months) {
  // Guard against bad inputs reaching the formula
  if (!isFinite(principal) || principal <= 0) return null;
  if (!isFinite(annualRate) || annualRate < 0) return null;
  if (!isFinite(months) || months < 1) return null;

  let emi;
  let totalRepayment;
  let totalInterest;

  if (annualRate === 0) {
    // Zero-interest: equal monthly instalments, no interest component
    emi = principal / months;
    totalRepayment = principal;
    totalInterest = 0;
  } else {
    // Standard EMI formula
    const r            = annualRate / 12 / 100;   // monthly rate (decimal)
    const n            = months;
    const onePlusRPowN = Math.pow(1 + r, n);

    emi = (principal * r * onePlusRPowN) / (onePlusRPowN - 1);
    totalRepayment = emi * months;
    totalInterest  = Math.max(0, totalRepayment - principal);
  }

  // Protect against unexpected NaN or Infinity
  if (!isFinite(emi) || isNaN(emi)) return null;

  return {
    emi           : emi,
    totalRepayment: totalRepayment,
    totalInterest : totalInterest,
  };
}


/* ===========================================================
   10. CALCULATION – buildAmortizationSchedule(P, r, n, emi)

   Generates a full month-by-month amortisation table.

   For each month:
     interestPaid  = openingBalance × monthlyRate
     principalPaid = EMI - interestPaid
     closingBalance = openingBalance - principalPaid

   ROUNDING POLICY:
     - All intermediate values use full floating-point precision.
     - Monetary display values are rounded to 2 decimal places
       only when rendering to the DOM or CSV.
     - The FINAL payment is adjusted so the remaining balance
       is exactly ₹0.00 (compensates for accumulated rounding).
     - Negative closing balances are clamped to 0.

   Returns: Array of row objects.
   =========================================================== */
function buildAmortizationSchedule(principal, annualRate, months, emi) {
  const schedule     = [];
  const monthlyRate  = annualRate / 12 / 100;
  let   balance      = principal;

  for (let month = 1; month <= months; month++) {
    const openingBalance = balance;
    let   interestPaid;
    let   principalPaid;
    let   closingBalance;
    let   monthEmi = emi;

    if (annualRate === 0) {
      // Zero-interest: equal principal instalments, zero interest
      interestPaid  = 0;
      if (month === months) {
        principalPaid = openingBalance;
        monthEmi      = principalPaid;
      } else {
        principalPaid = emi;
      }
    } else {
      interestPaid = openingBalance * monthlyRate;

      // Final payment adjustment: clear the loan balance exactly without accumulator drift
      if (month === months) {
        principalPaid = openingBalance;
        monthEmi      = principalPaid + interestPaid;
      } else {
        principalPaid = emi - interestPaid;
      }
    }

    closingBalance = Math.max(0, openingBalance - principalPaid);

    schedule.push({
      month         : month,
      openingBalance: openingBalance,
      emi           : monthEmi,
      principalPaid : principalPaid,
      interestPaid  : interestPaid,
      closingBalance: closingBalance,
    });

    balance = closingBalance;
  }

  return schedule;
}


/* ===========================================================
   11. DISPLAY – updateDonutChart(principal, totalInterest)

   Draws an SVG doughnut chart showing principal vs interest.

   The full circumference of r=80 circle = 2π×80 ≈ 502.65

   stroke-dasharray: "arcLength fullCircumference"
   We set dashoffset so principal starts at the top and
   interest follows immediately after.
   =========================================================== */
function updateDonutChart(principal, totalInterest) {
  const CIRCUMFERENCE = 2 * Math.PI * 80;  // ≈ 502.65
  const total = principal + totalInterest;

  let principalArc, interestArc;

  if (total <= 0) {
    // Nothing to show
    principalArc = 0;
    interestArc  = 0;
  } else if (totalInterest <= 0) {
    // Zero interest: full circle is principal
    principalArc = CIRCUMFERENCE;
    interestArc  = 0;
  } else {
    principalArc = (principal / total) * CIRCUMFERENCE;
    interestArc  = (totalInterest / total) * CIRCUMFERENCE;
  }

  // Principal arc: starts at top (dashoffset = 0 because we rotate -90°)
  chartPrincipalArc.setAttribute('stroke-dasharray',  principalArc + ' ' + CIRCUMFERENCE);
  chartPrincipalArc.setAttribute('stroke-dashoffset', '0');

  // Interest arc: starts exactly where principal ends
  // We achieve this by setting dashoffset = -(principalArc) so the dash
  // begins after principal's slice.
  chartInterestArc.setAttribute('stroke-dasharray',  interestArc  + ' ' + CIRCUMFERENCE);
  chartInterestArc.setAttribute('stroke-dashoffset', (-principalArc).toString());

  // Centre text: show total repayment in abbreviated form
  chartCentreValue.textContent = formatCurrencyShort(total);

  // Update legend values
  legendPrincipal.textContent = formatCurrency(principal);
  legendInterest.textContent  = formatCurrency(totalInterest);

  // Update accessible description
  const chartDesc = document.getElementById('chartDesc');
  if (chartDesc) {
    chartDesc.textContent =
      'Principal: ' + formatCurrency(principal) +
      ', Total Interest: ' + formatCurrency(totalInterest) +
      ', Total Repayment: ' + formatCurrency(total);
  }
}


/* ===========================================================
   HELPER – formatCurrencyShort(amount)

   Produces compact currency labels for the chart centre.
   ₹5,00,00,000 → ₹5 Cr
   ₹5,00,000    → ₹5 L
   ₹50,000      → ₹50K
   =========================================================== */
function formatCurrencyShort(amount) {
  if (!isFinite(amount) || amount <= 0) return '—';
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1).replace(/\.0$/, '') + ' Cr';
  if (amount >= 100000)   return '₹' + (amount / 100000).toFixed(1).replace(/\.0$/, '')   + ' L';
  if (amount >= 1000)     return '₹' + (amount / 1000).toFixed(1).replace(/\.0$/, '')     + 'K';
  return '₹' + amount.toFixed(0);
}


/* ===========================================================
   12. DISPLAY – displayResults(results, principal, rate, months)

   Updates the right-hand result card with calculated values.
   Shows the results container and hides the placeholder.
   =========================================================== */
function displayResults(results, principal, rate, months) {
  // Show results, hide placeholder
  placeholderMsg.hidden   = true;
  resultsContainer.hidden = false;

  // Update result elements
  if (resultLoanType) {
    const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
    const config = LOAN_BENCHMARKS[selectedKey];
    resultLoanType.textContent = config ? config.name : 'Loan';
  }
  resultEMI.textContent          = formatCurrency(results.emi);
  resultPrincipal.textContent    = formatCurrency(principal);
  resultInterest.textContent     = formatCurrency(results.totalInterest);
  resultTotal.textContent        = formatCurrency(results.totalRepayment);
  resultRate.textContent         = formatPercent(rate);
  resultTenureMonths.textContent = formatMonths(months);

  // Render the donut chart
  updateDonutChart(principal, results.totalInterest);
}


/* ===========================================================
   13. DISPLAY – showPlaceholder()

   Hides the results area and restores the empty-state message.
   Called during reset or when validation fails.
   =========================================================== */
function showPlaceholder() {
  placeholderMsg.hidden   = false;
  resultsContainer.hidden = true;
}


/* ===========================================================
   14. DISPLAY – buildScheduleTable(schedule)

   Populates the amortisation schedule table with data rows.
   =========================================================== */
function buildScheduleTable(schedule, emi) {
  // Clear old rows
  amortTableBody.innerHTML = '';

  const fragment = document.createDocumentFragment();

  schedule.forEach(function (row, index) {
    const tr  = document.createElement('tr');
    const isLast = index === schedule.length - 1;
    if (isLast) tr.classList.add('final-row');

    tr.innerHTML =
      '<td>' + row.month + '</td>' +
      '<td>' + formatCurrency(row.openingBalance) + '</td>' +
      '<td>' + formatCurrency(row.emi)           + '</td>' +
      '<td class="cell-principal">' + formatCurrency(row.principalPaid) + '</td>' +
      '<td class="cell-interest">'  + formatCurrency(row.interestPaid)  + '</td>' +
      '<td class="cell-balance">'   + formatCurrency(row.closingBalance) + '</td>';

    fragment.appendChild(tr);
  });

  amortTableBody.appendChild(fragment);

  // Show container, hide placeholder
  schedulePlaceholder.hidden = true;
  scheduleContainer.hidden   = false;

  // Update info line
  scheduleInfo.textContent =
    schedule.length + ' payment' + (schedule.length === 1 ? '' : 's') +
    ' · EMI: ' + formatCurrency(emi);
}


/* ===========================================================
   15. DISPLAY – clearSchedule()

   Hides the schedule table and shows the empty-state message.
   =========================================================== */
function clearSchedule() {
  schedulePlaceholder.hidden = false;
  scheduleContainer.hidden   = true;
  amortTableBody.innerHTML   = '';
  lastSchedule               = [];
}


/* ===========================================================
   16. DISPLAY – displayCompareResults(resultA, resultB, mA, mB)

   Shows the side-by-side comparison results and a plain-
   language difference summary.
   =========================================================== */
function displayCompareResults(resultA, resultB, monthsA, monthsB) {
  // Populate Scenario A
  compResultEmiA.textContent      = formatCurrency(resultA.emi);
  compResultInterestA.textContent = formatCurrency(resultA.totalInterest);
  compResultTotalA.textContent    = formatCurrency(resultA.totalRepayment);
  compResultDurationA.textContent = formatMonths(monthsA);

  // Populate Scenario B
  compResultEmiB.textContent      = formatCurrency(resultB.emi);
  compResultInterestB.textContent = formatCurrency(resultB.totalInterest);
  compResultTotalB.textContent    = formatCurrency(resultB.totalRepayment);
  compResultDurationB.textContent = formatMonths(monthsB);

  // Build difference pills
  compareDifference.innerHTML = '';

  // Monthly EMI comparison
  const emiDiff = Math.abs(resultA.emi - resultB.emi);
  if (emiDiff < 0.01) {
    compareDifference.appendChild(makeDiffPill('Both scenarios have identical monthly EMIs.', 'neutral'));
  } else {
    const lowerEmiLabel = resultA.emi < resultB.emi ? 'A' : 'B';
    compareDifference.appendChild(makeDiffPill(
      'Scenario ' + lowerEmiLabel + ' has the lower monthly EMI (' +
      formatCurrency(Math.min(resultA.emi, resultB.emi)) + ' vs ' +
      formatCurrency(Math.max(resultA.emi, resultB.emi)) + ')',
      lowerEmiLabel === 'A' ? 'a' : 'b'
    ));
  }

  // Total interest comparison
  const intDiff = Math.abs(resultA.totalInterest - resultB.totalInterest);
  if (intDiff < 0.01) {
    compareDifference.appendChild(makeDiffPill('Both scenarios have identical total interest.', 'neutral'));
  } else {
    const lowerIntLabel = resultA.totalInterest < resultB.totalInterest ? 'A' : 'B';
    compareDifference.appendChild(makeDiffPill(
      'Scenario ' + lowerIntLabel + ' pays less total interest by ' +
      formatCurrency(intDiff),
      lowerIntLabel === 'A' ? 'a' : 'b'
    ));
  }

  compareResults.hidden = false;
}


/* Helper: creates a styled pill element for the comparison summary. */
function makeDiffPill(text, type) {
  const span = document.createElement('span');
  span.className = 'diff-pill diff-pill--' + type;
  span.textContent = text;
  return span;
}


/* ===========================================================
   17. RESET – resetCalculator()

   Clears all main calculator inputs, removes error states,
   hides results, clears the chart, and resets sliders.
   =========================================================== */
function resetCalculator() {
  hasCalculated = false;
  clearOutdatedState();

  // Reset loan category selection state & hide inputs container
  if (loanTypeSelect)      loanTypeSelect.selectedIndex = 0;
  if (loanTypeBadge)       loanTypeBadge.hidden = true;
  if (resetToBenchmarkBtn) resetToBenchmarkBtn.hidden = true;
  if (loanInputsContainer)   loanInputsContainer.hidden = true;
  if (noLoanSelectedPrompt) noLoanSelectedPrompt.hidden = false;

  // Clear input values
  principalInput.value = '';
  rateInput.value      = '';
  tenureInput.value    = '';
  tenureUnit.value     = 'years';

  // Reset sliders to their default positions
  principalSlider.value = 500000;
  rateSlider.value      = 8.5;
  updateTenureSliderConfig();
  if (tenureSlider) tenureSlider.value = 5;

  // Clear all error states
  clearError(principalInput, wrapperPrincipal, errorPrincipal);
  clearError(rateInput,      wrapperRate,      errorRate);
  clearError(tenureInput,    wrapperTenure,    errorTenure);

  // Remove active state from preset scenario cards
  document.querySelectorAll('.preset-card').forEach(function (card) {
    card.classList.remove('active', 'is-selected');
    card.setAttribute('aria-pressed', 'false');
    const badge = card.querySelector('.preset-card-badge');
    const applyText = card.querySelector('.preset-apply-text');
    if (badge) {
      badge.textContent = '';
      badge.hidden = true;
    }
    if (applyText) applyText.textContent = 'Populate scenario';
  });

  // Remove active state from loan type selection cards
  document.querySelectorAll('.loan-type-card').forEach(function (card) {
    card.classList.remove('active', 'is-selected');
    card.setAttribute('aria-checked', 'false');
  });

  // Hide scenario feedback notice if visible
  const feedbackEl = document.getElementById('presetFeedback');
  if (feedbackEl) feedbackEl.hidden = true;
  if (presetFeedbackTimer) clearTimeout(presetFeedbackTimer);

  // Restore placeholder, hide results
  showPlaceholder();

  // Reset the donut chart to empty state
  resetDonutChart();

  // Clear amortisation schedule
  clearSchedule();
}


/* ===========================================================
   18. RESET – resetComparison()
   =========================================================== */
function resetComparison() {
  compPrincipalA.value = '';
  compRateA.value      = '';
  compTenureA.value    = '';
  compUnitA.value      = 'years';

  compPrincipalB.value = '';
  compRateB.value      = '';
  compTenureB.value    = '';
  compUnitB.value      = 'years';

  compErrorA.textContent = '';
  compErrorA.classList.remove('visible');
  compErrorB.textContent = '';
  compErrorB.classList.remove('visible');

  clearWrapperError(wrapperCompPA);
  clearWrapperError(wrapperCompRA);
  clearWrapperError(wrapperCompTA);
  clearWrapperError(wrapperCompPB);
  clearWrapperError(wrapperCompRB);
  clearWrapperError(wrapperCompTB);

  compareResults.hidden = true;
  compareDifference.innerHTML = '';
}

function clearWrapperError(wrapper) {
  if (wrapper) wrapper.classList.remove('is-error');
}


/* ===========================================================
   HELPER – resetDonutChart()

   Returns the SVG chart arcs to their zero/empty state.
   =========================================================== */
function resetDonutChart() {
  chartPrincipalArc.setAttribute('stroke-dasharray',  '0 503');
  chartPrincipalArc.setAttribute('stroke-dashoffset', '0');
  chartInterestArc.setAttribute('stroke-dasharray',   '0 503');
  chartInterestArc.setAttribute('stroke-dashoffset',  '0');
  chartCentreValue.textContent = '—';
  legendPrincipal.textContent  = '—';
  legendInterest.textContent   = '—';
}


/* ===========================================================
   19. FEATURE – applyPreset(card)

   Reads data-loan-type from a preset scenario card and populates
   the main calculator form with illustrative benchmark values.
   Does NOT calculate EMI automatically.
   =========================================================== */
let presetFeedbackTimer = null;

function showPresetFeedback(loanName) {
  const feedbackEl = document.getElementById('presetFeedback');
  const feedbackText = document.getElementById('presetFeedbackText');
  if (!feedbackEl || !feedbackText) return;

  feedbackText.innerHTML = `<strong>${loanName}</strong> scenario loaded into calculator. Review inputs below and click <strong>Calculate EMI</strong>.`;
  feedbackEl.hidden = false;

  if (presetFeedbackTimer) clearTimeout(presetFeedbackTimer);
  presetFeedbackTimer = setTimeout(function () {
    feedbackEl.hidden = true;
  }, 4500);
}

function applyPreset(card) {
  const presetKey = card.getAttribute('data-loan-type') || 'home';
  const config = LOAN_BENCHMARKS[presetKey];
  const loanName = config ? config.name : 'Loan';

  // Reveal manual entry form and hide prompt
  if (noLoanSelectedPrompt) noLoanSelectedPrompt.hidden = true;
  if (loanInputsContainer)   loanInputsContainer.hidden = false;
  if (selectedLoanTitle && config) selectedLoanTitle.textContent = config.name;

  if (loanTypeSelect) loanTypeSelect.value = presetKey;

  // Auto-fill illustrative scenario preset values
  if (config) {
    principalInput.value = config.suggestedAmount;
    rateInput.value      = config.suggestedRate;
    tenureInput.value    = config.suggestedTenure;
    tenureUnit.value     = config.tenureUnit || 'years';

    // Synchronize range sliders
    principalSlider.value = Math.min(Math.max(config.suggestedAmount, 10000), 10000000);
    rateSlider.value      = Math.min(Math.max(config.suggestedRate, 0), 30);
    updateTenureSliderConfig();
    if (tenureSlider) tenureSlider.value = config.suggestedTenure;
  }

  // Clear validation errors
  clearError(principalInput, wrapperPrincipal, errorPrincipal);
  clearError(rateInput,      wrapperRate,      errorRate);
  clearError(tenureInput,    wrapperTenure,    errorTenure);

  // Sync loan selection cards in calculator form
  const loanTypeCards = document.querySelectorAll('.loan-type-card');
  loanTypeCards.forEach(function (c) {
    const cardVal = c.getAttribute('data-loan-value');
    if (cardVal === presetKey) {
      c.classList.add('active', 'is-selected');
      c.setAttribute('aria-checked', 'true');
    } else {
      c.classList.remove('active', 'is-selected');
      c.setAttribute('aria-checked', 'false');
    }
  });

  // Sync scenario preset cards
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach(function (pc) {
    const cardKey = pc.getAttribute('data-loan-type');
    const badge = pc.querySelector('.preset-card-badge');
    const applyText = pc.querySelector('.preset-apply-text');
    if (pc === card) {
      pc.classList.add('active', 'is-selected');
      pc.setAttribute('aria-pressed', 'true');
      if (badge) {
        badge.textContent = 'Selected';
        badge.hidden = false;
      }
      if (applyText) applyText.textContent = 'Loaded into calculator';
    } else {
      pc.classList.remove('active', 'is-selected');
      pc.setAttribute('aria-pressed', 'false');
      if (badge) {
        badge.textContent = '';
        badge.hidden = true;
      }
      if (applyText) applyText.textContent = 'Populate scenario';
    }
  });

  // DO NOT calculate EMI automatically!
  hasCalculated = false;
  showPlaceholder();
  clearSchedule();
  resetDonutChart();
  clearOutdatedState();

  // Display accessible scenario loaded confirmation notice
  showPresetFeedback(loanName);

  // Smooth scroll to calculator form
  const calcSection = document.getElementById('calculator');
  if (calcSection) {
    calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


/* ===========================================================
   20. FEATURE – downloadPDF()

   Generates and downloads a professionally styled PDF document
   of the amortization repayment schedule using jsPDF and AutoTable.
   =========================================================== */

function formatPdfNumber(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  return Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPdfCurrency(amount) {
  return 'INR ' + formatPdfNumber(amount);
}

function downloadPDF() {
  if (!lastSchedule || lastSchedule.length === 0) {
    alert('Please calculate your EMI first to generate the schedule.');
    return;
  }

  // Graceful fallback if jsPDF is not available in the environment
  const jsPDFClass = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
  if (!jsPDFClass) {
    console.warn('jsPDF library not found. Falling back to printable schedule.');
    openPrintReadyPdfView();
    return;
  }

  const { principal, rate, months, emi } = lastScheduleInfo;

  // Determine loan label
  const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
  const benchmarkConfig = LOAN_BENCHMARKS[selectedKey];
  let loanTypeLabel = 'Custom Loan';
  if (benchmarkConfig) {
    const isCustom = checkIsCustomized();
    loanTypeLabel = isCustom ? `${benchmarkConfig.name} (Customized)` : benchmarkConfig.name;
  }

  // Calculate totals
  const totalPayment = lastSchedule.reduce(function (sum, r) { return sum + r.emi; }, 0);
  const totalInterest = lastSchedule.reduce(function (sum, r) { return sum + r.interestPaid; }, 0);

  // Initialize jsPDF document (Portrait A4, mm units)
  const doc = new jsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedDateTime = today.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ', ' + today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // 1. HEADER BANNER
  // -------------------------------------------------------------
  const headerHeight = 24;
  doc.setFillColor(30, 58, 138); // Brand Primary Navy (#1e3a8a)
  doc.rect(marginX, 14, contentWidth, headerHeight, 'F');

  // Accent line below header banner
  doc.setFillColor(59, 130, 246); // Blue-500 accent line
  doc.rect(marginX, 14 + headerHeight, contentWidth, 1.2, 'F');

  // Brand Name & Tagline (Left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EMI PRO', marginX + 6, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Loan Repayment Amortization Statement', marginX + 6, 31);

  // Statement Metadata (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(191, 219, 254); // Blue 200
  doc.text('STATEMENT OF REPAYMENT', pageWidth - marginX - 6, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240); // Slate 200
  doc.text('Generated: ' + formattedDateTime, pageWidth - marginX - 6, 29, { align: 'right' });

  // -------------------------------------------------------------
  // 2. LOAN SUMMARY CARD
  // -------------------------------------------------------------
  const cardY = 43;
  const cardHeight = 36;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200 border
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cardY, contentWidth, cardHeight, 2, 2, 'FD');

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('LOAN SUMMARY & KEY PARAMETERS', marginX + 6, cardY + 6);

  // Decorative subtle divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(marginX + 6, cardY + 8.5, pageWidth - marginX - 6, cardY + 8.5);

  // 6 Metric Items (2 rows x 3 columns)
  const col1X = marginX + 6;
  const col2X = marginX + 66;
  const col3X = marginX + 126;

  const row1LabelY = cardY + 14;
  const row1ValueY = cardY + 19;
  const row2LabelY = cardY + 26;
  const row2ValueY = cardY + 31;

  // Helper to render metric block
  function drawMetric(label, value, x, labelY, valueY, isHighlight) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label.toUpperCase(), x, labelY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isHighlight) {
      doc.setTextColor(30, 58, 138); // Highlight navy
    } else {
      doc.setTextColor(15, 23, 42);  // Slate 900
    }
    doc.text(String(value), x, valueY);
  }

  // Row 1
  drawMetric('Loan Category', loanTypeLabel, col1X, row1LabelY, row1ValueY, false);
  drawMetric('Annual Interest Rate', rate.toFixed(2) + '% p.a.', col2X, row1LabelY, row1ValueY, false);
  drawMetric('Monthly EMI', formatPdfCurrency(emi), col3X, row1LabelY, row1ValueY, true);

  // Row 2
  drawMetric('Principal Loan Amount', formatPdfCurrency(principal), col1X, row2LabelY, row2ValueY, false);
  drawMetric('Loan Tenure', formatMonths(months), col2X, row2LabelY, row2ValueY, false);
  drawMetric('Total Repayment Amount', formatPdfCurrency(totalPayment), col3X, row2LabelY, row2ValueY, false);

  // -------------------------------------------------------------
  // 3. AMORTIZATION SCHEDULE TABLE
  // -------------------------------------------------------------
  const tableRows = lastSchedule.map(function (row) {
    return [
      row.month,
      formatPdfNumber(row.openingBalance),
      formatPdfNumber(row.emi),
      formatPdfNumber(row.principalPaid),
      formatPdfNumber(row.interestPaid),
      formatPdfNumber(row.closingBalance),
    ];
  });

  const tableFoot = [[
    'Total',
    '-',
    formatPdfNumber(totalPayment),
    formatPdfNumber(principal),
    formatPdfNumber(totalInterest),
    '0.00',
  ]];

  // Call AutoTable plugin
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 83,
      head: [[
        '#',
        'Opening Balance (INR)',
        'EMI Payment (INR)',
        'Principal Paid (INR)',
        'Interest Paid (INR)',
        'Remaining Balance (INR)',
      ]],
      body: tableRows,
      foot: tableFoot,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', textColor: [16, 120, 80] },
        4: { halign: 'right', textColor: [180, 83, 9] },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: marginX, right: marginX, top: 18, bottom: 18 },
      didDrawPage: function (data) {
        // Page 2+ Running Header
        if (data.pageNumber > 1) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text('EMI Pro – Repayment Schedule (' + loanTypeLabel + ')', marginX, 11);
          doc.text('Date: ' + formattedDate, pageWidth - marginX, 11, { align: 'right' });
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(marginX, 13, pageWidth - marginX, 13);
        }
      },
    });
  }

  // -------------------------------------------------------------
  // 4. FOOTERS & PAGE NUMBERING (Applied to all pages)
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Confidential • Calculated using reducing balance amortization • EMI Pro by Sabari Balaji C K', marginX, pageHeight - 7);
    doc.text('Page ' + i + ' of ' + totalPages, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  }

  // -------------------------------------------------------------
  // 5. TRIGGER DOWNLOAD
  // -------------------------------------------------------------
  const sanitizedLoan = loanTypeLabel.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase();
  const dateStr = today.toISOString().slice(0, 10);
  const pdfFilename = 'EMI_Pro_Schedule_' + sanitizedLoan + '_' + dateStr + '.pdf';
  doc.save(pdfFilename);
}

function openPrintReadyPdfView() {
  if (!lastSchedule || lastSchedule.length === 0) return;
  const { principal, rate, months, emi } = lastScheduleInfo;
  const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
  const benchmarkConfig = LOAN_BENCHMARKS[selectedKey];
  const loanTypeLabel = benchmarkConfig ? benchmarkConfig.name : 'Custom Loan';
  const totalPayment = lastSchedule.reduce(function (sum, r) { return sum + r.emi; }, 0);
  const totalInterest = lastSchedule.reduce(function (sum, r) { return sum + r.interestPaid; }, 0);

  const rowsHtml = lastSchedule.map(function (row) {
    return '<tr>' +
      '<td style="text-align:center;padding:5px 8px;border-bottom:1px solid #e2e8f0;">' + row.month + '</td>' +
      '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e2e8f0;">' + formatCurrency(row.openingBalance) + '</td>' +
      '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e2e8f0;">' + formatCurrency(row.emi) + '</td>' +
      '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#047857;font-weight:500;">' + formatCurrency(row.principalPaid) + '</td>' +
      '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e2e8f0;color:#b45309;font-weight:500;">' + formatCurrency(row.interestPaid) + '</td>' +
      '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">' + formatCurrency(row.closingBalance) + '</td>' +
    '</tr>';
  }).join('');

  const printHtml =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>EMI Pro - ' + loanTypeLabel + ' Repayment Statement</title>' +
    '<style>' +
    '@page { size: A4 portrait; margin: 12mm; }' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; color: #1e293b; background: #fff; }' +
    '.header { background: #1e3a8a; color: white; padding: 16px 20px; border-radius: 6px; margin-bottom: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.header h2 { margin: 0 0 4px 0; font-size: 20px; letter-spacing: -0.5px; }' +
    '.header p { margin: 0; font-size: 11px; opacity: 0.85; }' +
    '.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.summary-item { font-size: 13px; }' +
    '.summary-item strong { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }' +
    'table { width: 100%; border-collapse: collapse; font-size: 11px; }' +
    'thead { display: table-header-group; }' +
    'tr { page-break-inside: avoid; }' +
    'th { background: #1e3a8a; color: white; padding: 7px 8px; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    'tr:nth-child(even) { background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    'tfoot { display: table-footer-group; }' +
    'tfoot tr { background: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    'tfoot td { padding: 8px; }' +
    '.footer-note { margin-top: 14px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }' +
    '</style></head><body>' +
    '<div class="header"><h2>EMI PRO – Repayment Schedule</h2><p>' + loanTypeLabel + ' • Generated on ' + new Date().toLocaleDateString('en-IN') + '</p></div>' +
    '<div class="summary">' +
    '<div class="summary-item"><strong>Loan Category</strong>' + loanTypeLabel + '</div>' +
    '<div class="summary-item"><strong>Principal Loan Amount</strong>' + formatCurrency(principal) + '</div>' +
    '<div class="summary-item"><strong>Annual Interest Rate</strong>' + rate.toFixed(2) + '% p.a.</div>' +
    '<div class="summary-item"><strong>Loan Tenure</strong>' + formatMonths(months) + '</div>' +
    '<div class="summary-item"><strong>Monthly EMI</strong><span style="color:#1e3a8a;font-weight:bold;">' + formatCurrency(emi) + '</span></div>' +
    '<div class="summary-item"><strong>Total Repayment</strong>' + formatCurrency(totalPayment) + '</div>' +
    '</div>' +
    '<table><thead><tr><th>#</th><th style="text-align:right">Opening Balance</th><th style="text-align:right">EMI Payment</th><th style="text-align:right">Principal Paid</th><th style="text-align:right">Interest Paid</th><th style="text-align:right">Remaining Balance</th></tr></thead>' +
    '<tbody>' + rowsHtml + '</tbody>' +
    '<tfoot><tr><td style="text-align:center">Total</td><td>-</td><td style="text-align:right">' + formatCurrency(totalPayment) + '</td><td style="text-align:right">' + formatCurrency(principal) + '</td><td style="text-align:right">' + formatCurrency(totalInterest) + '</td><td style="text-align:right">₹0.00</td></tr></tfoot>' +
    '</table>' +
    '<div class="footer-note">Confidential • Calculated using reducing balance amortization • EMI Pro by Sabari Balaji C K</div>' +
    '<script>window.onload = function() { window.print(); };<\/script></body></html>';

  // Use a hidden iframe for seamless printing without popup blocker issues
  try {
    let iframe = document.getElementById('printPdfIframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'printPdfIframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow || iframe.contentDocument;
    const frameDoc = doc.document || doc;
    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();
  } catch (err) {
    // Fallback to window.open if iframe is restricted
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  }
}


/* ===========================================================
   21. FEATURE – Theme Toggle

   Reads saved preference from localStorage, applies it,
   and toggles between light and dark on button click.
   =========================================================== */
function initTheme() {
  // Load saved preference (never storing personal/financial data)
  const saved = localStorage.getItem('emiPro_theme');
  const preferred = saved || 'light';
  applyTheme(preferred);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  localStorage.setItem('emiPro_theme', theme);
}

themeToggle.addEventListener('click', function () {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});


/* ===========================================================
   22. FEATURE – Mobile Navigation

   Controls opening and closing the mobile nav drawer cleanly.
   Ensures it is never shown on desktop.
   =========================================================== */
function openMobileNav() {
  mobileNav.classList.add('is-open');
  mobileNav.removeAttribute('hidden');
  navToggle.classList.add('is-open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Close navigation menu');
}

function closeMobileNav() {
  mobileNav.classList.remove('is-open');
  mobileNav.setAttribute('hidden', '');
  navToggle.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation menu');
}

function toggleMobileNav() {
  if (mobileNav.classList.contains('is-open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
}

navToggle.addEventListener('click', function (e) {
  e.stopPropagation();
  toggleMobileNav();
});

// Close mobile nav when a link is clicked
document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
  link.addEventListener('click', function () {
    closeMobileNav();
  });
});

// Close mobile nav when clicking outside
document.addEventListener('click', function (e) {
  if (mobileNav.classList.contains('is-open') && !mobileNav.contains(e.target) && !navToggle.contains(e.target)) {
    closeMobileNav();
  }
});

// Close on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
    closeMobileNav();
    navToggle.focus();
  }
});

// Close on resize to desktop view
window.addEventListener('resize', function () {
  if (window.innerWidth > 768 && mobileNav.classList.contains('is-open')) {
    closeMobileNav();
  }
});


/* ===========================================================
   23. FEATURE – Slider Synchronisation

   The range sliders mirror the number inputs and vice versa.
   Both trigger live recalculation (debounced).
   =========================================================== */
function syncSliderToInput(slider, input) {
  if (slider && input) slider.value = input.value;
}
function syncInputToSlider(input, slider, min, max) {
  if (!input || !slider) return;
  const val = parseFloat(input.value);
  if (isFinite(val)) {
    slider.value = Math.min(Math.max(val, min), max);
  }
}

// Update tenure slider min/max/labels depending on unit (years vs months)
function updateTenureSliderConfig() {
  if (!tenureSlider) return;
  const isYears = tenureUnit.value === 'years';
  if (isYears) {
    tenureSlider.min = '1';
    tenureSlider.max = '30';
    tenureSlider.step = '1';
    if (tenureSliderMin) tenureSliderMin.textContent = '1 Yr';
    if (tenureSliderMax) tenureSliderMax.textContent = '30 Yrs';
  } else {
    tenureSlider.min = '1';
    tenureSlider.max = '360';
    tenureSlider.step = '1';
    if (tenureSliderMin) tenureSliderMin.textContent = '1 Mo';
    if (tenureSliderMax) tenureSliderMax.textContent = '360 Mos';
  }
}

// Principal slider ↔ input
principalSlider.addEventListener('input', function () {
  principalInput.value = this.value;
  clearError(principalInput, wrapperPrincipal, errorPrincipal);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});
principalInput.addEventListener('input', function () {
  syncInputToSlider(this, principalSlider, 10000, 10000000);
  clearError(principalInput, wrapperPrincipal, errorPrincipal);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});

// Rate slider ↔ input
rateSlider.addEventListener('input', function () {
  rateInput.value = this.value;
  clearError(rateInput, wrapperRate, errorRate);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});
rateInput.addEventListener('input', function () {
  syncInputToSlider(this, rateSlider, 0, 30);
  clearError(rateInput, wrapperRate, errorRate);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});

// Tenure slider ↔ input
if (tenureSlider) {
  tenureSlider.addEventListener('input', function () {
    tenureInput.value = this.value;
    clearError(tenureInput, wrapperTenure, errorTenure);
    updateBenchmarkCustomStatus();
    markResultsOutdated();
  });
}
tenureInput.addEventListener('input', function () {
  const isYears = tenureUnit.value === 'years';
  const max = isYears ? 30 : 360;
  syncInputToSlider(this, tenureSlider, 1, max);
  clearError(tenureInput, wrapperTenure, errorTenure);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});
tenureUnit.addEventListener('change', function () {
  updateTenureSliderConfig();
  const isYears = tenureUnit.value === 'years';
  const max = isYears ? 30 : 360;
  syncInputToSlider(tenureInput, tenureSlider, 1, max);
  updateBenchmarkCustomStatus();
  markResultsOutdated();
});


/* ===========================================================
   PRIVATE CORE – runCalculation()

   Called ONLY when user clicks the "Calculate EMI" button or presses Enter.
   Validates all inputs. If valid, renders EMI, breakdown, and schedule.
   =========================================================== */
function runCalculation() {
  const { isValid, principal, rate, months } = validateMainForm(false);

  if (!isValid) {
    hasCalculated = false;
    showPlaceholder();
    clearSchedule();
    clearOutdatedState();
    return;
  }

  const results = calculateEMI(principal, rate, months);

  if (results === null) {
    hasCalculated = false;
    showPlaceholder();
    clearSchedule();
    clearOutdatedState();
    return;
  }

  // Calculation successful – update state and clear outdated banner
  hasCalculated = true;
  clearOutdatedState();

  // Display main results
  displayResults(results, principal, rate, months);

  // Build and display the amortisation schedule
  const schedule = buildAmortizationSchedule(principal, rate, months, results.emi);
  lastSchedule     = schedule;
  lastScheduleInfo = { principal, rate, months, emi: results.emi };
  buildScheduleTable(schedule, results.emi);

  // Smooth scroll to repayment summary
  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/* ===========================================================
   PRIVATE HELPERS – showError() / clearError()
   =========================================================== */
function showError(input, wrapper, errorEl, message) {
  if (wrapper) {
    wrapper.classList.add('is-error');
    wrapper.classList.remove('is-valid');
  }
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
  if (input) input.setAttribute('aria-invalid', 'true');
}

function clearError(input, wrapper, errorEl) {
  if (wrapper) wrapper.classList.remove('is-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  if (input) input.removeAttribute('aria-invalid');
}




/* ===========================================================
   24. EVENT LISTENERS – Main Calculator
   =========================================================== */

/**
 * FORM SUBMIT
 * Triggered ONLY by the "Calculate EMI" button or Enter key in form.
 */
emiForm.addEventListener('submit', function (event) {
  event.preventDefault();  // Prevent page reload
  runCalculation();
  updateBenchmarkCustomStatus();
});

/**
 * LOAN TYPE SELECT DROPDOWN
 * When a user selects any of the 12 loan types:
 * - Loads suggested benchmark values into inputs
 * - Syncs range sliders
 * - Does NOT calculate EMI (waits for Calculate EMI button click)
 */
if (loanTypeSelect) {
  loanTypeSelect.addEventListener('change', function () {
    applyBenchmark(this.value);
  });
}

/**
 * RESTORE BENCHMARK DEFAULTS BUTTON
 * Restores the standard suggested default values for the current loan type.
 * Does NOT calculate EMI until Calculate EMI is clicked.
 */
if (resetToBenchmarkBtn) {
  resetToBenchmarkBtn.addEventListener('click', function () {
    const selectedKey = loanTypeSelect ? loanTypeSelect.value : '';
    if (selectedKey) {
      applyBenchmark(selectedKey);
    }
  });
}

/**
 * RESET BUTTON
 */
resetBtn.addEventListener('click', function () {
  resetCalculator();
});


/* ===========================================================
   25. EVENT LISTENERS – Comparison Tool
   =========================================================== */
compareBtn.addEventListener('click', function () {
  const resA = validateCompareForm(
    compPrincipalA, compRateA, compTenureA, compUnitA, wrapperCompPA, wrapperCompRA, wrapperCompTA, compErrorA
  );
  const resB = validateCompareForm(
    compPrincipalB, compRateB, compTenureB, compUnitB, wrapperCompPB, wrapperCompRB, wrapperCompTB, compErrorB
  );

  if (!resA.isValid || !resB.isValid) {
    compareResults.hidden = true;
    return;
  }

  // Use the same central calculateEMI function – no formula duplication
  const calcA = calculateEMI(resA.principal, resA.rate, resA.months);
  const calcB = calculateEMI(resB.principal, resB.rate, resB.months);

  if (!calcA || !calcB) {
    alert('An unexpected calculation error occurred. Please check your inputs.');
    compareResults.hidden = true;
    return;
  }

  displayCompareResults(calcA, calcB, resA.months, resB.months);
});

// Real-time error clearing for comparison inputs
[
  { input: compPrincipalA, wrapper: wrapperCompPA, err: compErrorA },
  { input: compRateA,      wrapper: wrapperCompRA, err: compErrorA },
  { input: compTenureA,    wrapper: wrapperCompTA, err: compErrorA },
  { input: compPrincipalB, wrapper: wrapperCompPB, err: compErrorB },
  { input: compRateB,      wrapper: wrapperCompRB, err: compErrorB },
  { input: compTenureB,    wrapper: wrapperCompTB, err: compErrorB },
].forEach(function (item) {
  if (item.input) {
    item.input.addEventListener('input', function () {
      if (item.wrapper) item.wrapper.classList.remove('is-error');
      if (item.err) {
        item.err.textContent = '';
        item.err.classList.remove('visible');
      }
    });
  }
});

resetCompareBtn.addEventListener('click', function () {
  resetComparison();
});


/* ===========================================================
   26. EVENT LISTENERS – Presets, PDF, Theme, Nav
   =========================================================== */

// Preset scenario cards
document.querySelectorAll('.preset-card').forEach(function (card) {
  card.addEventListener('click', function () {
    applyPreset(this);
  });
});

// Loan type selection cards (.loan-type-card) in calculator form
const loanTypeCardsList = Array.from(document.querySelectorAll('.loan-type-card'));
loanTypeCardsList.forEach(function (card, index) {
  card.addEventListener('click', function () {
    const val = this.getAttribute('data-loan-value');
    if (val) {
      if (loanTypeSelect) loanTypeSelect.value = val;
      applyBenchmark(val);
    }
  });

  // Radiogroup keyboard accessibility (Arrow keys cycle through loan categories)
  card.addEventListener('keydown', function (e) {
    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      targetIndex = (index + 1) % loanTypeCardsList.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      targetIndex = (index - 1 + loanTypeCardsList.length) % loanTypeCardsList.length;
    }
    if (targetIndex !== -1) {
      e.preventDefault();
      loanTypeCardsList[targetIndex].focus();
      loanTypeCardsList[targetIndex].click();
    }
  });
});

// PDF Download
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', function () {
    downloadPDF();
  });
}

// Safe smooth scroll for internal navigation links
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (event) {
    const href = this.getAttribute('href');
    if (href && href.length > 1 && href.startsWith('#')) {
      try {
        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        // fallback to standard browser jump
      }
    }
  });
});

// Active section tracking (Scrollspy)
const navSections = [
  { id: 'calculator', link: document.querySelector('.nav-link[href="#calculator"]'), mobileLink: document.querySelector('.mobile-nav-link[href="#calculator"]') },
  { id: 'compare',    link: document.querySelector('.nav-link[href="#compare"]'),    mobileLink: document.querySelector('.mobile-nav-link[href="#compare"]') },
  { id: 'schedule',   link: document.querySelector('.nav-link[href="#schedule"]'),   mobileLink: document.querySelector('.mobile-nav-link[href="#schedule"]') }
];

function updateActiveNavOnScroll() {
  const scrollPosition = window.scrollY + 140;
  let currentId = '';

  navSections.forEach(function (sec) {
    const el = document.getElementById(sec.id);
    if (el) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = sec.id;
      }
    }
  });

  navSections.forEach(function (sec) {
    const isActive = sec.id === currentId;
    if (sec.link) sec.link.classList.toggle('active', isActive);
    if (sec.mobileLink) sec.mobileLink.classList.toggle('active', isActive);
  });
}

window.addEventListener('scroll', debounce(updateActiveNavOnScroll, 50), { passive: true });


/* ===========================================================
   27. INITIALISATION

   Runs once when the page loads:
   - Applies saved theme preference.
   - Sets initial slider positions to match placeholder values.
   - Initialises active nav link indicator.
   =========================================================== */
(function init() {
  // Apply saved theme (light by default)
  initTheme();

  // Ensure sliders start at their default visual positions
  principalSlider.value = 500000;
  rateSlider.value      = 8.5;
  updateTenureSliderConfig();
  if (tenureSlider) tenureSlider.value = 5;

  // Run scroll indicator once
  updateActiveNavOnScroll();
})();


/* ============================================================
   END OF script.js
   ============================================================ */
