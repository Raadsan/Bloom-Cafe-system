import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';
import '../controllers/cart_controller.dart';
import 'checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          "My Cart",
          style: TextStyle(
            color: Color(0xFF2D3E2D),
            fontWeight: FontWeight.w500,
            fontFamily: "Poppins",
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(IconlyLight.delete, color: Colors.redAccent),
            onPressed: () {
              Provider.of<CartController>(context, listen: false).clearCart();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Cart cleared"),
                  backgroundColor: Colors.redAccent,
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<CartController>(
        builder: (context, cart, child) {
          if (cart.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (cart.error != null) {
            return Center(child: Text('Error: ${cart.error}'));
          }

          final cartItems = cart.cartItems;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (cartItems.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            "Your cart is empty",
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                        ),
                      )
                    else
                      ...cartItems.map((item) {
                        final menuItem = item['menuItem'];
                        final title = menuItem['name'];
                        final price = menuItem['price'].toString();
                        final qty = item['quantity'];
                        final image =
                            (menuItem['imageUrl'] != null &&
                                menuItem['imageUrl'].isNotEmpty)
                            ? menuItem['imageUrl']
                            : "assets/images/pizza_cheese.png"; // Default image

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 15),
                          child: _buildCartItem(
                            title,
                            "Delicious $title", // Or map a description if available
                            "\$$price",
                            image,
                            qty,
                            () => cart.updateQuantity(
                              item['menuItemId'],
                              qty + 1,
                            ),
                            () => cart.updateQuantity(
                              item['menuItemId'],
                              qty - 1,
                            ),
                          ),
                        );
                      }).toList(),
                    const SizedBox(height: 25),
                  ],
                ),
              ),
              _buildOrderSummary(context, cartItems),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCartItem(
    String title,
    String desc,
    String price,
    String image,
    int qty,
    VoidCallback onAdd,
    VoidCallback onRemove,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: image.startsWith('http')
                ? Image.network(
                    image,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[200],
                      child: const Icon(Icons.fastfood, color: Colors.grey),
                    ),
                  )
                : Image.asset(
                    image,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[200],
                      child: const Icon(Icons.fastfood, color: Colors.grey),
                    ),
                  ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  desc,
                  style: TextStyle(color: Colors.grey[500], fontSize: 11),
                ),
                const SizedBox(height: 10),
                Text(
                  price,
                  style: TextStyle(
                    color: AppColors.primaryColor,
                    fontWeight: FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
          Column(
            children: [
              GestureDetector(onTap: onAdd, child: _buildQtyBtn(Icons.add)),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text(
                  qty.toString(),
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ),
              GestureDetector(
                onTap: onRemove,
                child: _buildQtyBtn(Icons.remove),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQtyBtn(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F8F1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 16, color: Colors.green),
    );
  }

  Widget _buildOrderSummary(BuildContext context, List cartItems) {
    double subtotal = 0;
    for (var item in cartItems) {
      final menuItem = item['menuItem'];
      subtotal += (menuItem['price'] * item['quantity']);
    }
    double deliveryFee = subtotal > 0 ? 2.0 : 0;
    double total = subtotal + deliveryFee;

    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildSummaryRow("Subtotal", "\$${subtotal.toStringAsFixed(2)}"),
          const SizedBox(height: 10),
          _buildSummaryRow(
            "Delivery Fee",
            "\$${deliveryFee.toStringAsFixed(2)}",
          ),
          const Divider(height: 30),
          _buildSummaryRow(
            "Total",
            "\$${total.toStringAsFixed(2)}",
            isTotal: true,
          ),
          const SizedBox(height: 25),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: () {
                if (cartItems.isNotEmpty) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CheckoutScreen(),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Cart is empty"),
                      backgroundColor: Colors.orange,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryColor,
                shape: RoundedRectangleWidget(
                  borderRadius: BorderRadius.circular(20),
                ),
                elevation: 5,
                shadowColor: AppColors.primaryColor.withOpacity(0.4),
              ),
              child: const Text(
                "Checkout Now",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isTotal ? const Color(0xFF2D3E2D) : Colors.grey[500],
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: isTotal ? AppColors.primaryColor : const Color(0xFF2D3E2D),
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.w500 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

// Fixed a small syntax issue in the ElevatedButton style
class RoundedRectangleWidget extends RoundedRectangleBorder {
  RoundedRectangleWidget({required BorderRadius borderRadius})
    : super(borderRadius: borderRadius);
}
