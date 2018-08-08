import React, { Component } from 'react';
import axios from '../../axios-orders.js';
import { connect } from 'react-redux';

import Burger from '../../components/Burger/Burger';
import BuildControls from '../../components/Burger/BuildControls/BuildControls';
import Modal from '../../components/UI/Modal/Modal';
import OrderSummary from '../../components/Burger/OrderSummary/OrderSummary';
import Spinner from '../../components/UI/Spinner/Spinner';
import withErrorHandler from '../../hoc/withErrorHandler/withErrorHandler';
import * as actionTypes from '../../store/actions';

class BurgerBuilder extends Component {

  state = {
    purchasable: false,
    purchasing: false,
    loading: false,
    error: false
  }

  componentDidMount () {
    axios.get('https://react-my-burger-bc835.firebaseio.com/ingredients.json')
      .then (response => {
        this.setState({ ingredients: response.data });
      })
      .catch(error => {
        this.setState({error: true});
      });
  }

  updatePurchaseState = (ingredients) => {
    // Object.keys creates an array of the keys of the given object.
    const sum = Object.keys(ingredients)
      .map(igKey => {
        return ingredients[igKey]
      })
      // in reduce, 0 is the starting amount.
      .reduce((sum, el) => {
        return sum + el;
      }, 0);
      this.setState({purchasable: sum > 0});
  }

  purchaseHandler = () => {
    this.setState({purchasing: true});
  }

  purchaseCancelHandler = () => {
    this.setState({purchasing: false});
  }

  purchaseContinueHandler = () => {
  const queryParams = [];
  for (let i in this.state.ingredients) {
    //this encodes the info so that it can be passed into search below.
    queryParams.push(encodeURIComponent(i) + '=' + encodeURIComponent(this.state.ingredients[i]))
  }
  queryParams.push('price=' + this.state.totalPrice);
  const queryString = queryParams.join('&');
  this.props.history.push({
    pathname: '/checkout',
    search: '?' + queryString
    });
  }

  render() {
    const disabledInfo = {
      ...this.props.ings
    }
    for (let key in disabledInfo) {
      disabledInfo[key] = disabledInfo[key] <= 0
    }

    let orderSummary = null;

    let burger = this.state.error ? <p>Ingredients can't be loaded</p> : <Spinner />;

    if (this.props.ings) {
      burger = (
        <React.Fragment>
          <Burger ingredients={this.props.ings} />
          <BuildControls
            ingredientAdded={this.props.onIngredientAdded}
            ingredientRemoved={this.props.onIngredientRemoved}
            disabled={disabledInfo}
            purchasable={this.state.purchasable}
            ordered={this.purchaseHandler}
            price={this.props.price}/>
          </React.Fragment>
        )
      orderSummary = <OrderSummary
          totalPrice={this.props.price}
          purchaseCancelled={this.purchaseCancelHandler}
          purchaseContinued={this.purchaseContinueHandler}
          ingredients={this.props.ings} />;
    }

    if (this.state.loading) {
      orderSummary = <Spinner />;
    }

    return(
      <React.Fragment>
        <Modal show={this.state.purchasing} modalClosed={this.purchaseCancelHandler}>
            {orderSummary}
        </Modal>
        {burger}
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    ings: state.ingredients,
    price: state.totalPrice
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onIngredientAdded: (ingName) => dispatch({type: actionTypes.ADD_INGREDIENT, ingredientName: ingName}),
    onIngredientRemoved: (ingName) => dispatch({type: actionTypes.REMOVE_INGREDIENT, ingredientName: ingName})
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withErrorHandler(BurgerBuilder, axios));
