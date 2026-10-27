import React from 'react';
import { Composition } from 'remotion';
import { DevhopDemo, DEVHOP_DEMO } from './projects/devhop/Demo';
import { DevhopLong, LONG_DEMO } from './projects/devhop/LongCut';

export const Root: React.FC = () => (
  <>
    <Composition id="DevhopDemo" component={DevhopDemo} {...DEVHOP_DEMO} />
    <Composition id="DevhopLong" component={DevhopLong} {...LONG_DEMO} />
  </>
);
