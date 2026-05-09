import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/colors.dart';
import '../../../../features/cart/presentation/controllers/cart_controller.dart';

class ProductDetailsScreen extends StatefulWidget {
  final int id;
  final String title;
  final String image;
  final String price;
  final String description;

  const ProductDetailsScreen({
    super.key,
    required this.id,
    required this.title,
    required this.image,
    required this.price,
    required this.description,
  });

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Content
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Image
                Stack(
                  children: [
                    Container(
                      height: MediaQuery.of(context).size.height * 0.45,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.bgColor,
                        borderRadius: const BorderRadius.vertical(
                          bottom: Radius.circular(50),
                        ),
                      ),
                      child: Hero(
                        tag: widget.title,
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(40),
                            child: widget.image.startsWith('http')
                                ? Image.network(
                                    widget.image,
                                    fit: BoxFit.contain,
                                    loadingBuilder:
                                        (context, child, loadingProgress) {
                                          if (loadingProgress == null)
                                            return child;
                                          return Shimmer.fromColors(
                                            baseColor: Colors.grey[300]!,
                                            highlightColor: Colors.grey[100]!,
                                            child: Container(
                                              width:
                                                  200, // Reasonable fallback size
                                              height: 200,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius:
                                                    BorderRadius.circular(20),
                                              ),
                                            ),
                                          );
                                        },
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Icon(
                                              Icons.image_not_supported,
                                              size: 50,
                                              color: Colors.grey,
                                            ),
                                  )
                                : Image.asset(
                                    widget.image,
                                    fit: BoxFit.contain,
                                  ),
                          ),
                        ),
                      ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 10,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildCircleBtn(
                              IconlyLight.arrow_left,
                              () => Navigator.pop(context),
                            ),
                            _buildCircleBtn(IconlyLight.heart, () {}),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.all(25),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              widget.title,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w500,
                                fontFamily: "Poppins",
                                color: Color(0xFF1B3022),
                              ),
                            ),
                          ),
                          Text(
                            widget.price,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w500,
                              color: AppColors.primaryColor,
                              fontFamily: "Poppins",
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(
                            Icons.star,
                            color: Colors.orange,
                            size: 18,
                          ),
                          const SizedBox(width: 5),
                          const Text(
                            "4.8",
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            "(120+ Reviews)",
                            style: TextStyle(
                              color: Colors.grey[400],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 25),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildInfoItem(IconlyLight.time_circle, "20-30 min"),
                          _buildInfoItem(IconlyLight.star, "4.8 Rating"),
                          _buildInfoItem(IconlyLight.discovery, "150 kcal"),
                        ],
                      ),
                      const SizedBox(height: 25),
                      const Text(
                        "Description",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          fontFamily: "Poppins",
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        widget.description,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                          height: 1.6,
                          fontFamily: "Poppins",
                        ),
                      ),
                      const SizedBox(height: 100), // Space for bottom button
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Bottom Bar
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(25),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(35),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 15,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F8F1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        _buildQtyBtn(Icons.remove, () {
                          if (_quantity > 1) setState(() => _quantity--);
                        }),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 15),
                          child: Text(
                            _quantity.toString(),
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        _buildQtyBtn(
                          Icons.add,
                          () => setState(() => _quantity++),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Consumer<CartController>(
                      builder: (context, cart, child) {
                        final isAdded = cart.isItemInCart(widget.id);
                        return SizedBox(
                          height: 55,
                          child: ElevatedButton(
                            onPressed: () async {
                              if (isAdded) {
                                cart.removeCartItem(widget.id);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text("Removed from cart"),
                                    backgroundColor: Colors.red,
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              } else {
                                bool success = await cart.addToCart(
                                  widget.id,
                                  quantity: _quantity,
                                );
                                if (success && context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        "${widget.title} added to cart!",
                                      ),
                                      backgroundColor: Colors.green,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isAdded
                                  ? Colors.red
                                  : AppColors.primaryColor,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              elevation: 0,
                            ),
                            child: Text(
                              isAdded ? "Remove from Cart" : "Add to Cart",
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                fontFamily: "Poppins",
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Icon(icon, color: Colors.black, size: 20),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primaryColor, size: 18),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.primaryColor, size: 18),
      ),
    );
  }
}
