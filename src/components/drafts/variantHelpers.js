// Variant management helpers for Chrome extension
// Based on web app's postHelpers.js approach

// Get all available variants in a flat array (My Voice first, then LiGo's Take)
export const getAllVariants = (draft) => {
  if (!draft || !draft.variants) return [];
  
  const allVariants = [];
  
  // Add My Voice variants first (if available)
  const myVoiceVariants = draft.variants.my_voice || [];
  myVoiceVariants.forEach((variant, index) => {
    allVariants.push({
      content: variant.content || "",
      type: "My Voice",
      originalType: "my_voice",
      originalIndex: index,
      variantIndex: variant.index || index + 1
    });
  });
  
  // Add LiGo's Take variants
  const ligoVariants = draft.variants.ligo_take || [];
  ligoVariants.forEach((variant, index) => {
    allVariants.push({
      content: variant.content || "",
      type: "LiGo's Take", 
      originalType: "ligo_take",
      originalIndex: index,
      variantIndex: variant.index || index + 1
    });
  });
  
  return allVariants;
};

// Get variant content for display
export const getVariantContent = (draft, flatIndex) => {
  const variants = getAllVariants(draft);
  // If no variants exist, show the main draft content
  if (variants.length === 0) {
    return draft.content || "";
  }
  return variants[flatIndex]?.content || draft.content || "";
};

// Get variant type for display
export const getVariantType = (draft, flatIndex) => {
  const variants = getAllVariants(draft);
  return variants[flatIndex]?.type || "";
};

// Get total number of variants for a draft
export const getVariantCount = (draft) => {
  const variants = getAllVariants(draft);
  // Return at least 1 to show the main content if no variants exist
  return Math.max(1, variants.length);
};

// Get variant label for display (e.g., "Variant 1 (My Voice)")
export const getVariantLabel = (draft, flatIndex) => {
  const variants = getAllVariants(draft);
  const variant = variants[flatIndex];
  
  // If no variants exist, just show "Draft"
  if (variants.length === 0) {
    return "Draft";
  }
  
  if (!variant) return "Variant 1";
  
  return `Variant ${flatIndex + 1} (${variant.type})`;
};

// Get the original variant type and index for API calls
export const getOriginalVariantInfo = (draft, flatIndex) => {
  const variants = getAllVariants(draft);
  const variant = variants[flatIndex];
  if (!variant) return { type: "my_voice", index: 1 };
  
  return {
    type: variant.originalType,
    index: variant.variantIndex
  };
};

// Navigate to next/previous variant in flat array
export const getNextVariantIndex = (draft, currentIndex, direction) => {
  const variants = getAllVariants(draft);
  const totalItems = Math.max(1, variants.length);
  
  if (totalItems <= 1) return currentIndex;
  
  let newIndex = direction === 'next' 
    ? currentIndex + 1 
    : currentIndex - 1;
  
  if (newIndex < 0) newIndex = totalItems - 1;
  if (newIndex >= totalItems) newIndex = 0;
  
  return newIndex;
};