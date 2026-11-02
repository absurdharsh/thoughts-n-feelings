import React from 'react';
import { DoodleDivider } from './HandDrawnDoodles';

export default function GreekMeanderDivider({ className = '' }) {
  return <DoodleDivider className={`text-ink/20 dark:text-darkInk/20 ${className}`} />;
}
