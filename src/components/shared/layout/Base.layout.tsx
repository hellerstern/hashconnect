import React, { FC } from 'react';
import styled from 'styled-components';
import Modal from '@components/shared/modal';
import Header from '@components/shared/layout/Header';
import Footer from '@components/shared/layout/Footer';

export const BaseLayout: FC = ({ children }) => {
  return (
    <BaseLayoutWrapper>
      {children}
      <Modal />
    </BaseLayoutWrapper>
  );
};

const BaseLayoutWrapper = styled.div`
  background-color: #1E1E1E;
  height: 100vh;
  width: 100vw;
  * {
    box-sizing: border-box;
  }
`