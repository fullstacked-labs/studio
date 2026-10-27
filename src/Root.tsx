import React from 'react';
import { Composition } from 'remotion';
import { DevhopDemo, DEVHOP_DEMO } from './projects/devhop/Demo';

export const Root: React.FC = () => (
  <>
    <Composition id="DevhopDemo" component={DevhopDemo} {...DEVHOP_DEMO} />
  </>
);
