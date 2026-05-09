import 'package:flutter/material.dart';
import 'package:restaurant_delivery_app/features/cart/presentation/controllers/cart_controller.dart';
import 'package:shimmer/shimmer.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/colors.dart';

class FoodGridItem extends StatelessWidget {
  final int id;
  final String title;
  final String desc;
  final String image;
  final double price;
  final VoidCallback? onTap;

  const FoodGridItem({
    super.key,
    required this.id,
    required this.title,
    required this.desc,
    required this.image,
    required this.price,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: image.startsWith('http')
                    ? Image.network(
                        image,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Shimmer.fromColors(
                            baseColor: Colors.grey[300]!,
                            highlightColor: Colors.grey[100]!,
                            child: Container(width: double.infinity, color: Colors.white),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) => Container(width: double.infinity, color: Colors.grey[200], child: const Icon(Icons.image_not_supported, color: Colors.grey)),
                      )
                    : Image.asset(image, width: double.infinity, fit: BoxFit.cover),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(desc, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.grey[500], fontSize: 10)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("\$${price.toStringAsFixed(2)}", style: TextStyle(color: AppColors.primaryColor, fontWeight: FontWeight.bold, fontSize: 14)),
                      Consumer<CartController>(
                        builder: (context, cart, child) {
                          final isAdded = cart.isItemInCart(id);
                          return GestureDetector(
                            onTap: () async {
                              if (isAdded) {
                                cart.removeCartItem(id);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("Removed from cart"), duration: Duration(seconds: 1)),
                                );
                              } else {
                                bool success = await cart.addToCart(id);
                                if (success && context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text("$title added to cart!"),
                                      backgroundColor: Colors.green,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: isAdded ? Colors.green.shade100 : AppColors.primaryColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                isAdded ? Icons.check : Icons.add,
                                color: isAdded ? Colors.green : Colors.white,
                                size: 16,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
