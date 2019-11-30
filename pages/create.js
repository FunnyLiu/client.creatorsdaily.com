import React, { useRef } from 'react'
import styled from 'styled-components'
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'
import { Button, Col, Row, Typography, message } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import Page from '../layouts/Page'
import Container from '../components/Container'
import useAuth from '../hooks/useAuth'
import ProductEditor from '../components/ProductEditor'
import formError from '../libs/form-error'
import { formToProduct } from '../components/ProductForm'
import { GET_PRODUCTS } from '../queries'
import withApollo from '../libs/with-apollo'

const { Title, Paragraph, Text } = Typography

const StyledTitle = styled(Title)`
text-align: center;
margin-top: 24px;
margin-bottom: 24px !important;
`

const StyledTypography = styled(Typography)`
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

const CREATE_PRODUCT = gql`
mutation($product: IProduct!) {
  createProduct(product: $product) {
    id
    name
  }
}
`

export default withApollo(() => {
  const ref = useRef()
  useAuth()
  const { replace } = useRouter()
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
      const { form } = ref.current.props
      const errors = formError(form, error)
      message.error(errors[0].message)
    },
    refetchQueries: () => [{
      query: GET_PRODUCTS,
      variables: {
        page: 1,
        size: 15
      }
    }]
  })
  const handleSubmit = values => {
    create({
      variables: {
        product: formToProduct(values)
      }
    })
  }
  return (
    <Page>
      <StyledContainer>
        <Row type='flex' gutter={24} justify='center'>
          <Col md={12} xs={24}>
            <StyledTypography>
              <StyledTitle level={4}>发布产品</StyledTitle>
              <Paragraph>
                这里是爱意满满的作品展示区，无论您是产品的 <Text strong>创造者</Text> ，还是产品的 <Text strong>发现者</Text> ，都可以在这里将它展示给全世界。
              </Paragraph>
              <Paragraph>
                完成产品发布后，会自动推送至 <a href='https://kz.sync163.com/web/topic/vqNzr253b46Yk?uid=ZNlYrg5BAReny' target='_blank'>快知</a>、<a href='https://tophub.today/n/YKd6JwndaP' target='_blank'>今日热榜</a> 等平台，并有机会入选
                <Text strong>
                今日产品
                </Text>
                推送至公众号、知乎等平台。
              </Paragraph>
            </StyledTypography>
          </Col>
        </Row>
        <ProductEditor step={1} product={{}} onSubmit={handleSubmit} wrappedComponentRef={ref} renderFooter={() => (
          <StyledButton loading={loading} htmlType='submit' type='primary'>推荐产品</StyledButton>
        )} />
      </StyledContainer>
    </Page>
  )
})
