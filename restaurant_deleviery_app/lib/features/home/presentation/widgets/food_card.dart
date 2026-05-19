import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/core/theme/colors.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../features/cart/presentation/controllers/cart_controller.dart';

class FoodCard extends StatefulWidget {
  final int id;
  final String title;
  final String desc;
  final String? discount;
  final String image;
  final double price;
  final double? oldPrice;
  final VoidCallback? onTap;

  const FoodCard({
    super.key,
    required this.id,
    required this.title,
    required this.desc,
    this.discount,
    required this.image,
    required this.price,
    this.oldPrice,
    this.onTap,
  });

  @override
  State<FoodCard> createState() => _FoodCardState();
}

class _FoodCardState extends State<FoodCard> {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
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
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.horizontal(
                    left: Radius.circular(15),
                  ),
                  child: widget.image.startsWith('http')
                      ? Image.network(
                          widget.image,
                          width: 110,
                          height: 110,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Shimmer.fromColors(
                              baseColor: Colors.grey[300]!,
                              highlightColor: Colors.grey[100]!,
                              child: Container(
                                width: 110,
                                height: 110,
                                color: Colors.white,
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) =>
                              Container(
                                width: 110,
                                height: 110,
                                color: Colors.grey[200],
                                child: const Icon(
                                  Icons.image_not_supported,
                                  color: Colors.grey,
                                ),
                              ),
                        )
                      : Image.asset(
                          widget.image,
                          width: 110,
                          height: 110,
                          fit: BoxFit.cover,
                        ),
                ),
                if (widget.discount != null)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.btnColor,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        widget.discount!,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    SizedBox(height: 12),
                    Text(
                      widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.desc,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        "\$${widget.price.toStringAsFixed(2)}",
                        style: const TextStyle(
                          color: AppColors.textColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      if (widget.oldPrice != null)
                        Text(
                          "\$${widget.oldPrice!.toStringAsFixed(2)}",
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 10,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                    ],
                  ),
                  Consumer<CartController>(
                    builder: (context, cart, child) {
                      final isAdded = cart.isItemInCart(widget.id);
                      return GestureDetector(
                        onTap: () async {
                          if (isAdded) {
                            cart.removeCartItem(widget.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Removed from cart"),
                                duration: Duration(seconds: 1),
                              ),
                            );
                          } else {
                            bool success = await cart.addToCart(widget.id);
                            if (success && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    "${widget.title} added to cart!",
                                  ),
                                  backgroundColor: AppColors.btnColor,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            }
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isAdded
                                ? AppColors.btnColor.withValues(alpha: 0.2)
                                : AppColors.btnColor,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isAdded ? Icons.check : Icons.add,
                            color: isAdded ? AppColors.btnColor : Colors.white,
                            size: 18,
                          ),
                        ),
                      );
                    },
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
