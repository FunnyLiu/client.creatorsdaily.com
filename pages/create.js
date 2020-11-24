import React, { useState } from 'react'
import styled from 'styled-components'
import { gql, useMutation, useQuery } from '@apollo/client'
import { Button, Col, Modal, Row } from 'antd'
import get from 'lodash/get'
import Router, { useRouter } from 'next/router'
import { RouterContext } from 'next/dist/next-server/lib/router-context'
import Page from '../layouts/Page'
import Container from '../components/Container'
import ProductEditor from '../components/ProductEditor.dynamic'
import withApollo from '../libs/with-apollo'
import ProductCell from '../components/ProductCell'
import { formToProduct } from '../libs/form-utils'
import graphqlError from '../libs/graphql-error'
import useCheckMobile from '../hooks/useCheckMobile'
import message from '../libs/message.dynamic'
import SearchProduct from '../queries/SearchProduct.gql'

const StyledTitle = styled.h1`
text-align: center;
margin-top: 24px;
margin-bottom: 24px !important;
`

const StyledTypography = styled.div`
margin-bottom: 24px;
`

const StyledContainer = styled(Container)`
margin-top: 24px;
margin-bottom: 24px;
`

const StyledButton = styled(Button)`
margin: 24px auto 0;
display: block;
`

const StyledProductCell = styled(ProductCell)`
box-shadow: none;
border: 1px solid #E0E0E0;
margin-bottom: 16px;
`

const CREATE_PRODUCT = gql`
mutation($product: IProduct!) {
  createProduct(product: $product) {
    id
    name
  }
}
`

const ModalContent = withApollo(({ list }) => {
  return (
    <div style={{ marginTop: 24 }}>
      {
        list.map(x => (
          <StyledProductCell key={x.id} size='small' {...x} />
        ))
      }
    </div>
  )
})

export default withApollo(() => {
  const [searchLoading, setSearchLoading] = useState(false)
  useCheckMobile()
  const { replace } = useRouter()
  const {
    refetch
  } = useQuery(SearchProduct, {
    skip: true
  })
  const [create, { loading }] = useMutation(CREATE_PRODUCT, {
    onCompleted: data => {
      const id = get(data, 'createProduct.id')
      const step = 2
      message.success('推荐成功')
      replace({
        pathname: '/[id]/editor',
        query: {
          id,
          step
        }
      }, `/${id}/editor?step=${step}`)
    },
    onError: error => {
      const errors = graphqlError(error)
      message.error(errors[0].message)
    }
  })
  const handleFinish = async values => {
    setSearchLoading(true)
    const { data } = await refetch({
      keyword: values.name,
      score: 20,
      size: 5
    })
    setSearchLoading(false)
    const runCreate = () => create({
      variables: {
        product: formToProduct(values)
      }
    })
    const list = get(data, 'searchProducts.data', [])
    const total = get(data, 'searchProducts.total', 0)
    if (total) {
      return Modal.confirm({
        getContainer: '#page-create',
        title: '搜索到已存在以下产品，是否继续推荐？',
        okText: '继续推荐',
        maskClosable: true,
        autoFocusButton: null,
        icon: null,
        content: (
          <RouterContext.Provider value={Router}>
            <ModalContent list={list} />
          </RouterContext.Provider>
        ),
        onOk () {
          runCreate()
        }
      })
    }
    runCreate()
  }
  return (
    <Page id='page-create'>
      <StyledContainer>
        <Row type='flex' gutter={24} justify='center'>
          <Col md={12} xs={24} />
        </Row>
        <ProductEditor
          step={1}
          product={{}}
          onFinish={handleFinish}
          renderFooter={() => (
            <StyledButton loading={searchLoading || loading} htmlType='submit' type='primary'>推荐产品</StyledButton>
          )}
        >
          <StyledTypography>
            <StyledTitle level={4}>发布产品</StyledTitle>
            <p>
              这里是爱意满满的作品展示区，无论您是产品的 <strong>创造者</strong> ，还是产品的 <strong>发现者</strong> ，都可以在这里将它展示给全世界。
            </p>
            <p>
              完成产品发布后，会自动推送至 <a href='https://kz.sync163.com/web/topic/vqNzr253b46Yk?uid=ZNlYrg5BAReny' target='_blank' rel='noopener noreferrer'>快知</a>、<a href='https://tophub.today/n/YKd6JwndaP' target='_blank' rel='noopener noreferrer'>今日热榜</a>、<a href='https://t.me/creatorsdaily' target='_blank' rel='noopener noreferrer'>Telegram</a> 等平台，并有机会入选
              <strong>
                今日产品
              </strong>
              推荐至我们的媒体矩阵，目前可覆盖超 <strong>53000+</strong> 用户
            </p>
          </StyledTypography>
        </ProductEditor>
      </StyledContainer>
    </Page>
  )
})
